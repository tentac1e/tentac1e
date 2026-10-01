/* Гид по базилику — живые модели главы «Вкус и аромат». Файл собирает scripts/build.py из src/labs/vkus/ — правьте там */
(() => {
  'use strict';
  const { register, illustrate, api: h } = window.BasilScience;
  const S = window.BasilScene;
  const { $, $$, clamp, lerp, fmt, fmt0, esc } = h;
  const NS = 'http://www.w3.org/2000/svg';
  const r1 = v => Math.round(v * 10) / 10;
  const pct = v => `${fmt0(v * 100)} %`;
  const MONTHS = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  const MONTHS_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  const set = (root, id, html) => { const e = $('#' + id, root); if (e) e.innerHTML = html; };
  const doyToday = () => { const t = new Date(); return Math.round((t - new Date(t.getFullYear(), 0, 0)) / 864e5); };
  const doyLabel = n => { const d = new Date(2023, 0, n); return `${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`; };
  const citiesChips = (id, lat) => h.chipsHtml(id, 'Город', h.CITIES.map(([l, n]) => [l, n]), lat);

  const { micro, food } = window.BasilLibs;
  { const st = document.createElement('style'); st.dataset.labs = "vkus"; st.textContent = "/* trichomes */\n.tr-controls { display: flex; flex-wrap: wrap; align-items: end; justify-content: space-between; gap: 12px 18px; }\n.tr-controls .lab-actions { margin: 0; }\n.tr-wrap { position: relative; margin-top: 12px; }\n.tr-chart { border-radius: 18px; overflow: hidden; border: 1px solid var(--line); background: var(--mic-air); }\n.tr-svg { display: block; font-family: var(--font-body); }\n.tr-svg .mic-t { cursor: pointer; }\n.tr-pel { outline: none; }\n.tr-pel:focus-visible .mic-dome-cut { stroke: var(--ink); stroke-width: 2.6; }\n@media (hover: hover) { .tr-pel:not(.is-burst):hover .mic-dome { transform: scale(1.06); } }\n.tr-light-note { margin: 8px 2px 0; }\n.tr-info { margin-top: 12px; padding: 14px 16px; border-radius: 16px; background: var(--surface); border: 1px solid var(--line); min-height: 7.5em; }\n.tr-info h5 { font-family: var(--font-display); font-size: 1.3rem; margin: 2px 0 6px; }\n.tr-info p { margin: 0; color: var(--ink-2); font-size: .95rem; line-height: 1.55; }\n.tr-controls .lab-seg button { white-space: nowrap; }\n.tr-info .tr-size { margin-top: 8px; font: 500 .78rem/1.4 var(--font-mono); color: var(--ink-3); }\n.tr-grid { margin-top: 16px; grid-template-columns: minmax(0, 1fr) minmax(0, 220px); align-items: center; }\n.tr-top { display: grid; gap: 6px; justify-items: center; text-align: center; }\n.tr-top svg { width: 100%; max-width: 220px; height: auto; border-radius: 16px; box-shadow: 0 0 0 1px var(--line); }\n.tr-surf { fill: var(--mic-epi-2); }\n.tr-wall { fill: none; stroke: var(--mic-wall-soft); stroke-width: 1.2; }\n.tr-sto ellipse { fill: var(--mic-guard); stroke: var(--mic-wall); stroke-width: .8; }\n.tr-sto path { stroke: var(--mic-wall); stroke-width: 1; }\n.tr-capdot { fill: var(--mic-sec-2); stroke: var(--mic-oil); stroke-width: 1; }\n.tr-pelrim { fill: var(--mic-sec); stroke: var(--mic-wall-soft); stroke-width: 1; }\n.tr-pelx { stroke: var(--mic-oil-deep); stroke-width: .7; opacity: .45; }\n.tr-pelhi { fill: var(--mic-oil-hi); opacity: .8; }\n.tr-hairtop { fill: none; stroke: var(--mic-wall); stroke-width: 2.6; stroke-linecap: round; opacity: .55; }\n@media (max-width: 560px) { .tr-grid { grid-template-columns: 1fr; } }\n/* pathway: two assembly lines of aroma */\n.pw-pick { display: flex; flex-wrap: wrap; gap: 6px; margin: 12px 0 10px; }\n.pw-chip { display: inline-flex; align-items: center; gap: 6px; }\n.pw-chip i { width: 10px; height: 10px; border-radius: 50%; }\n.pw-chart { border-radius: 18px; }\n.pw-lane { fill: color-mix(in srgb, var(--m-lin) 6%, transparent); stroke: color-mix(in srgb, var(--m-lin) 22%, transparent); stroke-width: 1; stroke-dasharray: 4 4; }\n.pw-lane.is-phen { fill: color-mix(in srgb, var(--m-est) 6%, transparent); stroke: color-mix(in srgb, var(--m-est) 22%, transparent); }\n.pw-edge { stroke: var(--line-strong); stroke-width: 1.8; }\n.pw-edge.is-hot { stroke: var(--k); stroke-width: 3; }\n.pw-ah { fill: var(--line-strong); }\n.pw-ah.is-hot { fill: var(--k); }\n.pw-enz { font: 600 10.5px/1 var(--font-mono); fill: var(--ink-3); paint-order: stroke; stroke: var(--surface); stroke-width: 3px; }\n.pw-enz.is-hot { fill: var(--k); font-weight: 700; }\n.pw-tag rect { fill: var(--surface); stroke: var(--line-strong); stroke-width: 1; }\n.pw-tag.is-hot rect { stroke: var(--k); }\n.pw-node rect { fill: var(--surface); stroke: var(--line-strong); stroke-width: 1.3; }\n.pw-node text { font: 600 12px/1 var(--font-body); fill: var(--ink-2); }\n.pw-node.is-hot rect { stroke: var(--k); stroke-width: 2; fill: var(--k-soft); }\n.pw-node.is-hot text { fill: var(--ink); }\n.pw-node.is-idle, .pw-end.is-idle { opacity: .42; }\n.pw-end { cursor: pointer; outline: none; }\n/* a finger finds a molecule in a zone a little taller than its pill */\ng.pw-end rect.pw-hit { fill: transparent; stroke: none; }\n.pw-end rect { stroke: var(--mk); stroke-width: 1.8; fill: var(--surface); transition: fill .3s; }\n.pw-end text { font: 700 12.5px/1 var(--font-body); fill: var(--ink); }\n.pw-end.is-sel rect { fill: var(--mk); }\n.pw-end.is-sel text { fill: var(--surface); }\n.pw-end:hover rect, .pw-end:focus-visible rect { stroke-width: 3; }\n.pw-zone { font: 600 11px/1 var(--font-mono); letter-spacing: .08em; text-transform: uppercase; fill: var(--ink-3); }\n.pw-info { margin-top: 12px; padding: 14px 16px; border-radius: 16px; background: var(--k-soft); }\n.pw-info h5, .chemo-info h5, .pair-info h5 { margin: 0 0 6px; font-family: var(--font-display); font-size: 1.35rem; }\n.pw-info p { margin: 0 0 6px; font-size: .95rem; line-height: 1.55; }\n.pw-sorts { font-size: .85rem !important; color: var(--ink-3); }\n/* molecules: the stage, the canvas and the hint are shared with the home page (src/css/lab/06-lab-tools.css) */\n.mol-lab { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 360px); gap: clamp(16px, 3vw, 30px); align-items: start; }\n@media (max-width: 800px) { .mol-lab { grid-template-columns: 1fr; } }\n.mol-key { display: flex; flex-wrap: wrap; gap: 14px; margin: 8px 0 0; font-size: .8rem; color: var(--ink-2); }\n.mol-key i { display: inline-block; width: 11px; height: 11px; margin-right: 6px; border-radius: 50%; vertical-align: -1px; }\n.mk-c { background: var(--mol-c); } .mk-o { background: var(--mol-o); }\n.mol-card { padding: 18px; border-radius: 20px; background: var(--surface); border: 1px solid var(--line); box-shadow: var(--shadow-sm); }\n.mol-name { margin: 2px 0 0; font-family: var(--font-display); font-size: 2rem; line-height: 1; }\n.mol-alt { margin: 4px 0 0; color: var(--ink-3); font-style: italic; }\n.mol-formula { margin: 10px 0 12px; font: 500 .95rem/1.3 var(--font-mono); color: var(--k); }\n.mol-card p:last-child { margin: 0; color: var(--ink-2); }\n.mol-chips { margin-top: 16px; }\n.vol-scale { margin-top: 18px; }\n.vol-track { position: relative; height: 96px; border-radius: 16px; background: linear-gradient(90deg, var(--sci-phys-soft), var(--surface-2) 45%, var(--sci-taste-soft)); border: 1px solid var(--line); overflow: hidden; }\n.vol-chip {\n  position: absolute;\n  left: var(--x);\n  top: 10px;\n  translate: -50% 0;\n  display: grid;\n  justify-items: center;\n  gap: 1px;\n  padding: 4px 8px;\n  border-radius: 10px;\n  border: 1.5px solid var(--line-strong);\n  background: var(--surface);\n  cursor: pointer;\n  white-space: nowrap;\n  transition: transform .3s var(--ease-float);\n}\n.vol-chip b { font-size: .74rem; line-height: 1.1; color: var(--ink); }\n.vol-chip small { font: 500 .64rem/1 var(--font-mono); color: var(--ink-3); }\n.vol-chip { border-color: var(--mc, var(--line-strong)); }\n.vol-chip:hover { transform: translateY(-2px); }\n@media (pointer: coarse) { .vol-chip { min-height: 38px; align-content: center; } }\n.vol-chip[aria-pressed=\"true\"] { box-shadow: 0 0 0 3px color-mix(in srgb, var(--k) 45%, transparent); }\n.vol-axis { display: flex; justify-content: space-between; gap: 10px; margin-top: 6px; font: 500 .68rem/1.2 var(--font-mono); color: var(--ink-3); }\n@media (max-width: 640px) { .vol-axis span:nth-child(2) { display: none; } }\n\n/* chemotype: composition ring, character web, sorts as stacked bars */\n.chemo-grid { display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr); gap: 18px; margin-top: 14px; align-items: start; }\n@media (max-width: 860px) { .chemo-grid { grid-template-columns: 1fr; } }\n.chemo-card { padding: 14px; border-radius: 20px; background: var(--surface); border: 1px solid var(--line); }\n.chemo-figs { display: grid; grid-template-columns: minmax(0, .85fr) minmax(0, 1.25fr); gap: 8px; align-items: center; }\n@media (max-width: 520px) { .chemo-figs { grid-template-columns: 1fr; } }\n.chemo-fig { display: grid; gap: 6px; }\n.chemo-ring-bg { fill: none; stroke: var(--m-rest); opacity: .6; }\n.chemo-seg { fill: none; transition: stroke-dasharray .6s var(--ease-float), stroke-dashoffset .6s var(--ease-float), opacity .3s; }\n.chemo-seg.is-dim { opacity: .18; }\n.chemo-c1 { font: 700 22px/1 var(--font-display); fill: var(--ink); }\n.chemo-c2 { font: 600 12.5px/1 var(--font-body); fill: var(--ink-2); }\n.chemo-top { list-style: none; margin: 0; padding: 0; display: grid; gap: 4px; }\n.chemo-top li { display: grid; grid-template-columns: 12px minmax(0, 1fr) auto; gap: 8px; align-items: center; font-size: .86rem; color: var(--ink-2); }\n.chemo-top i { width: 12px; height: 12px; border-radius: 4px; }\n.chemo-top b { font: 600 .8rem/1 var(--font-mono); color: var(--ink); }\n@media (max-width: 520px) {\n  .chemo-fig:first-child { grid-template-columns: 136px minmax(0, 1fr); align-items: center; gap: 10px; }\n  .chemo-top li { font-size: .8rem; gap: 6px; }\n}\n.chemo-web { fill: none; stroke: var(--line); stroke-width: 1; }\n.chemo-web:last-of-type { stroke: var(--line-strong); }\n.chemo-axis { stroke: var(--line); stroke-width: 1; }\n.chemo-ax { font: 600 11.5px/1 var(--font-body); fill: var(--ink-2); }\n.chemo-shape { fill: color-mix(in srgb, var(--k) 22%, transparent); stroke: var(--k); stroke-width: 2.2; stroke-linejoin: round; }\n.chemo-ref { fill: none; stroke: var(--ink-3); stroke-width: 1.4; stroke-dasharray: 4 4; }\n.chemo-pt { fill: var(--surface); stroke: var(--k); stroke-width: 2; }\n.chemo-info { margin-top: 10px; padding: 12px 14px; border-radius: 14px; background: var(--k-soft); }\n.chemo-info h5 { font-family: var(--font-display); font-size: 1.3rem; margin: 2px 0 6px; }\n.chemo-info p { margin: 0; font-size: .95rem; line-height: 1.55; }\n.chemo-cmp { margin-top: 8px !important; display: flex; align-items: center; gap: 8px; font-size: .82rem !important; color: var(--ink-3); }\n.chemo-cmp i { width: 22px; border-top: 1.6px dashed var(--ink-3); }\n.chemo-side .lab-label { display: block; margin: 0 0 8px; }\n.chemo-side .lab-label + .chemo-mols { margin-bottom: 8px; }\n.chemo-list { display: grid; gap: 4px; margin-bottom: 16px; }\n.chemo-row { display: grid; grid-template-columns: 104px minmax(0, 1fr) 42px; gap: 10px; align-items: center; padding: 7px 8px; border: 1px solid transparent; border-radius: 12px; background: none; font: inherit; color: var(--ink-2); cursor: pointer; text-align: left; transition: background .2s, border-color .2s; }\n.chemo-row:hover { background: var(--surface-2); }\n.chemo-row[aria-pressed=\"true\"] { background: var(--surface); border-color: var(--k); color: var(--ink); }\n.chemo-name { font: 700 .86rem/1.15 var(--font-body); }\n.chemo-bar { display: flex; height: 16px; border-radius: 6px; overflow: hidden; gap: 1.5px; background: var(--m-rest); }\n.chemo-bar i { display: block; min-width: 0; transition: opacity .25s; }\n.chemo-bar i.is-rest { background: var(--m-rest); }\n.chemo-val { font: 600 .78rem/1 var(--font-mono); color: var(--ink); text-align: right; }\n.chemo-list[data-m]:not([data-m=\"\"]) .chemo-bar i { opacity: .16; }\n.chemo-list[data-m=\"lin\"] .chemo-bar i[data-m=\"lin\"], .chemo-list[data-m=\"cin\"] .chemo-bar i[data-m=\"cin\"], .chemo-list[data-m=\"cit\"] .chemo-bar i[data-m=\"cit\"],\n.chemo-list[data-m=\"cam\"] .chemo-bar i[data-m=\"cam\"], .chemo-list[data-m=\"est\"] .chemo-bar i[data-m=\"est\"], .chemo-list[data-m=\"meu\"] .chemo-bar i[data-m=\"meu\"],\n.chemo-list[data-m=\"eug\"] .chemo-bar i[data-m=\"eug\"], .chemo-list[data-m=\"mci\"] .chemo-bar i[data-m=\"mci\"], .chemo-list[data-m=\"car\"] .chemo-bar i[data-m=\"car\"],\n.chemo-list[data-m=\"ber\"] .chemo-bar i[data-m=\"ber\"] { opacity: 1; }\n.chemo-mols { display: flex; flex-wrap: wrap; gap: 6px; }\n.chemo-mol { display: inline-flex; align-items: center; gap: 6px; }\n.chemo-mol i { width: 10px; height: 10px; border-radius: 50%; }\n.chemo-mol[aria-pressed=\"true\"] i { box-shadow: 0 0 0 2px var(--surface); }\n/* the catalogue's sorts under their chemotype */\n.chemo-group { display: grid; gap: 4px; }\n.chemo-row.is-cur:not([aria-pressed=\"true\"]) { border-color: var(--line-strong); background: var(--surface); }\n.chemo-sorts { display: flex; flex-wrap: wrap; gap: 4px 6px; padding: 0 8px 6px 18px; }\n.chemo-sort { display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px 3px 6px; border-radius: 999px; border: 1px solid var(--line); background: none; font: 600 .74rem/1.2 var(--font-body); color: var(--ink-2); cursor: pointer; transition: border-color .2s, background .2s; }\n.chemo-sort:hover { border-color: var(--line-strong); }\n@media (pointer: coarse) { .chemo-sort { min-height: 36px; padding-inline: 10px 12px; } .chemo-sorts { gap: 6px; } .chemo-row { min-height: 40px; } }\n.chemo-sort[aria-pressed=\"true\"] { background: var(--k); border-color: var(--k); color: var(--surface); }\n.chemo-sort i { width: 9px; height: 12px; border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%; background: var(--lf-green); }\n.chemo-sort.lf-deep i { background: var(--lf-deep); } .chemo-sort.lf-purple i { background: var(--lf-purple); } .chemo-sort.lf-thai i { background: var(--lf-thai); } .chemo-sort.lf-lime i { background: var(--lf-lime); }\n.chemo-aroma { font-weight: 600; color: var(--ink) !important; margin-bottom: 4px !important; }\n.chemo-note { margin-top: 8px !important; font-size: .84rem !important; color: var(--ink-3); }\n/* heat model */\n.heat-rows { display: grid; gap: 8px; margin-top: 8px; }\n.heat-row { display: grid; grid-template-columns: 140px minmax(0, 1fr) 60px; gap: 12px; align-items: center; }\n.heat-name { display: grid; }\n.heat-name b { font-size: .88rem; }\n.heat-name small { font: 500 .68rem/1.2 var(--font-mono); color: var(--ink-3); }\n.heat-bar { position: relative; height: 16px; }\n.heat-bar i { position: absolute; left: 0; top: 0; bottom: 0; width: var(--w); border-radius: 0 8px 8px 0; transition: width .45s var(--ease-float); }\n.heat-ghost { background: var(--ser-muted); }\n.heat-fill.s1 { background: var(--ser-1); } .heat-fill.s2 { background: var(--ser-2); } .heat-fill.s3 { background: var(--ser-3); } .heat-fill.s4 { background: var(--ser-4); }\n.heat-val { font: 600 .82rem/1 var(--font-mono); text-align: right; }\n@media (max-width: 520px) { .heat-row { grid-template-columns: 104px minmax(0, 1fr) 46px; gap: 8px; } .heat-name b { font-size: .8rem; white-space: nowrap; } }\n\n.heat-sort { min-width: 200px; }\n.heat-sort select { width: 100%; }\n/* anthocyanin */\n.anth-grid { grid-template-columns: 150px minmax(0, 1fr); align-items: center; }\n@media (max-width: 520px) { .anth-grid { grid-template-columns: 1fr; justify-items: center; } }\n.anth-jar { width: 140px; height: auto; }\n.anth-leaf { opacity: .9; }\n.anth-out { margin: 0; font-size: .92rem; color: var(--ink-2); }\n\n/* pairing lab: your basil → foods ranked → the bridge of shared molecules */\n.pa-types, .pa-varieties, .pa-foods { display: flex; gap: 8px; overflow-x: auto; scroll-snap-type: x proximity; padding: 2px 2px 10px; margin: 0 -2px 6px; scrollbar-width: thin; }\n.pa-type, .pa-var { flex: none; display: inline-flex; align-items: center; gap: 6px; scroll-snap-align: start; }\n.pa-type svg, .pa-var svg { width: 14px; height: 24px; }\n.pa-type small { margin-left: 2px; font-size: .72rem; font-weight: 700; color: var(--ink-3); }\n.pa-type[aria-pressed=\"true\"] small { color: inherit; opacity: .75; }\n/* the varieties of the chosen type sit on a shelf under the types */\n.pa-varieties { margin-top: -2px; padding: 8px 8px 10px; border-radius: 16px; background: var(--surface-2); box-shadow: inset 0 0 0 1px var(--line); }\n.pa-var { font-size: .84rem; }\n.pa-foods { gap: 10px; }\n.pa-food { flex: none; width: 112px; scroll-snap-align: start; display: grid; justify-items: center; gap: 4px; padding: 10px 8px 9px; border-radius: 18px; border: 1px solid var(--line); background: var(--surface); font: inherit; color: var(--ink-2); cursor: pointer; transition: border-color .2s, box-shadow .2s, transform .2s; }\n.pa-food:hover { border-color: var(--line-strong); }\n.pa-food[aria-pressed=\"true\"] { border-color: var(--k); box-shadow: 0 0 0 2px color-mix(in srgb, var(--k) 30%, transparent); color: var(--ink); }\n.pa-ico { width: 52px; height: 52px; }\n.pa-name { font: 700 .8rem/1.15 var(--font-body); text-align: center; min-height: 2.3em; display: grid; place-items: center; }\n.pa-meter { width: 100%; height: 6px; border-radius: 3px; background: var(--surface-2); overflow: hidden; box-shadow: inset 0 0 0 1px var(--line); }\n.pa-meter i { display: block; height: 100%; width: calc(var(--v, 0) * 100%); background: var(--k); border-radius: 3px; transition: width .5s var(--ease-float); }\n.pa-food.is-contrast .pa-meter i { background: repeating-linear-gradient(90deg, var(--ink-3) 0 6px, transparent 6px 9px); }\n.pa-word { font: 500 .68rem/1.1 var(--font-mono); color: var(--ink-3); text-align: center; }\n.pa-food.is-contrast + .pa-food:not(.is-contrast), .pa-food:not(.is-contrast) + .pa-food.is-contrast { margin-left: 14px; }\n.pa-stage { margin-top: 6px; padding: 14px; border-radius: 20px; background: var(--surface); border: 1px solid var(--line); }\n.pa-title { margin: 0 0 4px; display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 10px; font: 600 1.25rem/1.2 var(--font-display); color: var(--ink); }\n.pa-title i { font-style: normal; color: var(--k); }\n.pa-chart { margin: 0 -6px; }\n.pa-rib { fill: none; opacity: .55; stroke-linecap: round; stroke-dasharray: 1 0; }\n.pa-rib.is-dash { stroke-dasharray: .035 .025; opacity: .7; }\n.pa-rib.is-in { animation: pa-draw .7s var(--ease-float) both; animation-delay: inherit; }\n.pa-rib.is-dash.is-in { animation: none; }\n@keyframes pa-draw { from { stroke-dasharray: 0 1; } to { stroke-dasharray: 1 0; } }\n.pa-node { stroke-width: 6; stroke-opacity: .25; paint-order: stroke; }\n.pa-node.is-faint { fill-opacity: .15; stroke-dasharray: 3 3; stroke-opacity: .8; stroke-width: 1.5; }\n.pa-lever { fill: var(--surface-2); stroke: var(--line-strong); stroke-width: 1.2; }\n.pa-tag rect { fill: var(--surface); opacity: .94; }\n.pa-mol { font: 700 12px/1 var(--font-body); fill: var(--ink); paint-order: stroke; stroke: var(--surface); stroke-width: 4px; stroke-linejoin: round; }\n.pa-sub { font: 500 10.5px/1 var(--font-mono); fill: var(--ink-3); paint-order: stroke; stroke: var(--surface); stroke-width: 4px; stroke-linejoin: round; }\n.pa-info { padding: 12px 14px; border-radius: 14px; background: var(--k-soft); }\n.pa-info p { margin: 0 0 8px; font-size: .95rem; line-height: 1.55; }\n.pa-verdict { font-size: .9rem !important; color: var(--ink-2); }\n.pa-verdict b { color: var(--ink); }\n@media (min-width: 900px) {\n  .pa-foods, .pa-types, .pa-varieties { flex-wrap: wrap; overflow: visible; }\n  .pa-food { width: calc((100% - 50px) / 6); }\n  .pa-food.is-contrast + .pa-food:not(.is-contrast), .pa-food:not(.is-contrast) + .pa-food.is-contrast { margin-left: 0; }\n  .pa-stage { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); gap: 4px 18px; align-items: center; }\n  .pa-title { grid-column: 1 / -1; }\n}\n.pa-note { font-size: .84rem !important; color: var(--ink-3); }\n"; document.head.appendChild(st); }
  /* @use micro */
  const TR_INFO = {
    intro: ['Срез листа', 'Весь лист — около трети миллиметра. Сверху вниз: кутикула и эпидермис, столбчатая и губчатая ткани с хлоропластами, жилка, нижний эпидермис с устьицами. Аромат живёт снаружи — в железках на поверхности. Коснитесь любой части среза.', ''],
    epi: ['Эпидермис и кутикула', 'Один слой плоских прозрачных клеток без хлоропластов: свет проходит сквозь них вглубь листа. Сверху — кутикула, восковая плёнка, которая не выпускает воду. Из клеток эпидермиса вырастают все волоски и железки.', 'клетка — около 15–25 мкм в высоту, кутикула тоньше 3 мкм'],
    pal: ['Столбчатая ткань', 'Вытянутые клетки стоят плотным частоколом и набиты хлоропластами — здесь идёт большая часть фотосинтеза. Хлоропласты прижаты к стенкам, а на слишком ярком свету поворачиваются к нему ребром, чтобы не обгореть.', 'у листа на солнце — два слоя клеток, у листа в тени — один'],
    spo: ['Губчатая ткань', 'Рыхлые клетки неправильной формы, между ними — воздушные ходы. По ним углекислый газ от устьиц расходится по всему листу, а водяной пар уходит наружу. Хлоропластов меньше, поэтому нижняя сторона листа светлее верхней.', 'воздух занимает до трети объёма этого слоя'],
    vein: ['Жилка', 'Проводящий пучок в кольце клеток обкладки. Сверху — ксилема: мёртвые полые трубки с одревесневшими стенками (здесь они малиновые, как после окраски сафранином), по ним поднимается вода с ионами. Снизу — флоэма: живые ситовидные трубки, они уносят сахар из листа к корням, почкам и цветкам.', 'мелкая жилка — 60–80 мкм в поперечнике'],
    loepi: ['Нижний эпидермис', 'Такие же прозрачные клетки, но устьиц здесь больше, чем сверху. Железки тоже есть: нижняя сторона листа пахнет не хуже верхней.', ''],
    stoma: ['Устьице', 'Две замыкающие клетки и щель между ними. На свету клетки набирают воду, выгибаются, и щель открывается: внутрь идёт CO₂, наружу — пар. Над щелью — воздушная полость, от неё начинаются ходы губчатой ткани.', 'щель — несколько микрометров, на миллиметре листа их сотни'],
    pel: ['Пельтатная железка', 'Главное хранилище аромата. Четыре клетки головки выделяют эфирное масло в пространство под кутикулой, и она раздувается блестящим пузырём. В таких пузырях — почти весь линалоол, эвгенол и эстрагол листа. Пузырь лопается от лёгкого касания: поэтому потёртый лист пахнет сильнее.', 'пузырь — 60–90 мкм, под лупой виден как золотистая точка'],
    cap: ['Головчатая железка', 'Маленькая: ножка из одной-двух клеток и круглая головка. Выделяет понемногу масла и слизи, быстро опустошается и почти не добавляет аромата — главные здесь пельтатные.', 'около 20–30 мкм'],
    hair: ['Кроющий волосок', 'Несколько клеток в ряд, без масла, с бугорчатой оболочкой. Волоски рассеивают резкий свет, держат у поверхности слой влажного воздуха и мешают мелким насекомым.', 'до 100–200 мкм в длину']
  };
  register('trichome', el => {
    el.innerHTML = h.head('Лист под микроскопом', 'Поперечный срез листа базилика. Коснитесь любой ткани или железки, чтобы узнать, что она делает. «Потереть лист» — и пузыри масла лопнут.') +
      `<div class="lab-controls tr-controls">
         ${h.segHtml('lab-tr-light', 'Лист вырос', [['sun', 'на солнце'], ['shade', 'в тени']], 'sun')}
         <div class="lab-actions"><button class="btn btn-primary btn-small" type="button" id="lab-tr-rub">${h.icon('nose')}Потереть лист</button><button class="btn btn-ghost btn-small" type="button" id="lab-tr-reset">Заново</button></div>
       </div>
       <div class="tr-wrap"><div class="lab-chart tr-chart" id="lab-tr-ch"></div><div class="aroma-layer" id="lab-tr-aroma" aria-hidden="true"></div></div>
       <p class="lab-foot tr-light-note" id="lab-tr-note"></p>
       <div class="tr-info" id="lab-tr-info" aria-live="polite"></div>
       <div class="lab-grid tr-grid">
         <div class="lab-controls">${h.rangeHtml('lab-tr-age', 'Лист', 0, 100, 1, 20)}<p class="lab-foot">Вид сверху на один и тот же участок. Железки закладываются, пока лист крошечный; потом лист растягивается, а их число почти не меняется — на каждом квадратном миллиметре их становится меньше.</p></div>
         <div class="tr-top"><svg id="lab-tr-top" viewBox="0 0 200 200" role="img" aria-label="Вид сверху на участок листа с железками"></svg><p class="tick" id="lab-tr-cap"></p></div>
       </div>`;
    let light = 'sun', sel = null;
    const burst = new Set();
    const glands = [];
    const layer = $('#lab-tr-aroma', el);
    const ch = h.chart($('#lab-tr-ch', el), {
      label: 'Поперечный срез листа базилика с железками, жилкой и устьицами',
      // on a wide screen the section is drawn 1.3× larger: the same cells, easier to see
      h: w => (w < 520 ? 420 : 430 * 1.3),
      draw(W, HH) {
        const k = W < 520 ? 1 : 1.3, w = W / k, H = HH / k;
        const sun = light === 'sun';
        const TOP = 112;
        const pal = sun ? [44, 42] : [54];
        const spo = sun ? 100 : 84;
        const narrow = w < 520;
        const veinX = Math.round(w * (narrow ? 0.66 : 0.6));
        const stomata = narrow ? [Math.round(w * 0.3)] : [Math.round(w * 0.3), Math.round(w * 0.84)];
        const sec = micro.section(w, { top: TOP, epi: 22, pal, spo, lo: 17, veins: [veinX], stomata, seed: sun ? 11 : 12 });
        const y = sec.y, rnd = micro.rng(5);
        let s = `<defs><radialGradient id="mic-oil-grad" cx=".38" cy=".3" r=".8"><stop offset="0" stop-color="var(--mic-oil-hi)"/><stop offset=".45" stop-color="var(--mic-oil)"/><stop offset="1" stop-color="var(--mic-oil-deep)"/></radialGradient>
          <linearGradient id="lab-tr-air" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--mic-air)"/><stop offset="1" stop-color="var(--mic-air-2)"/></linearGradient></defs>`;
        s += `<rect x="0" y="0" width="${w}" height="${H}" fill="url(#lab-tr-air)"/>`;
        s += sec.svg;
        // glands on the upper side: where they stand depends on the width
        const up = narrow
          ? [['pel', 0.2], ['cap', 0.45], ['pel', 0.72], ['hair', 0.93]]
          : [['pel', 0.12], ['hair', 0.25], ['cap', 0.36], ['pel', 0.5], ['cap', 0.66], ['pel', 0.8], ['hair', 0.93]];
        const fill = sun ? 1 : 0.62;
        glands.length = 0;
        const items = [];
        let pi = 0;
        up.forEach(([k, f]) => {
          const x = Math.round(w * f);
          const d = k === 'pel' ? micro.peltate(x, y.cut, { fill, rnd, r: narrow ? 22 : 25 }) : k === 'cap' ? micro.capitate(x, y.cut, { rnd }) : micro.hair(x, y.cut, { rnd, len: 66, bend: 18 });
          const id = k === 'pel' ? pi++ : null;
          const state = id !== null && burst.has(id) ? ' is-burst is-done' : '';
          s += `<g class="mic-t tr-gl tr-${k}${state}" data-t="${k}"${id !== null ? ` data-i="${id}" tabindex="0" role="button" aria-label="Пельтатная железка: нажмите, чтобы она лопнула"` : ''}>${d.g}</g>`;
          if (id !== null) glands.push(id);
          items.push({ k, x: d.tx == null ? x : d.tx, top: d.top });
        });
        // one gland of each kind underneath too
        const lp = micro.peltate(Math.round(w * (narrow ? 0.5 : 0.56)), y.bot, { up: -1, fill: fill * 0.55, rnd, r: 18 });
        const lc = micro.capitate(Math.round(w * (narrow ? 0.12 : 0.18)), y.bot, { up: -1, rnd });
        const lid = pi++;
        s += `<g class="mic-t tr-gl tr-pel${burst.has(lid) ? ' is-burst is-done' : ''}" data-t="pel" data-i="${lid}">${lp.g}</g><g class="mic-t tr-gl tr-cap" data-t="cap">${lc.g}</g>`;
        glands.push(lid);
        // captions: glands above, tissues on pills at the left edge
        const names = { pel: 'пельтатная железка', cap: 'головчатая', hair: 'волосок' };
        const seen = {};
        const top = items.filter(it => { if (seen[it.k]) return false; seen[it.k] = 1; return true; })
          .map(it => ({ x: it.x, text: it.k === 'pel' ? 'масло под кутикулой' : names[it.k], to: [it.x, it.top - 3], t: it.k }));
        s += micro.labels(top, w, [18, 40]);
        const band = (yy, text, t) => micro.pill(6, yy, text, { t });
        s += band(y.epi + 11, 'эпидермис', 'epi');
        s += band(y.pal + (y.spo - y.pal) / 2, 'столбчатая ткань', 'pal');
        s += band(y.spo + spo * 0.62, 'губчатая ткань', 'spo');
        const vy = y.spo + Math.min(40, spo * 0.42);
        s += micro.labels([{ x: veinX + 72, text: 'жилка', to: [veinX + 42, vy], t: 'vein' }], w, [vy]);
        s += micro.labels([{ x: stomata[0], text: 'устьице', to: [stomata[0], y.bot + 2], t: 'stoma' }], w, [y.bot + 34]);
        s += micro.scale(w - 12, H - 14, 60, '50 мкм');
        return `<g class="tr-scene${sel ? ' has-sel' : ''}"${k !== 1 ? ` transform="scale(${k})"` : ''}>${s}</g>`;
      }
    });
    ch.svg.classList.add('tr-svg');
    const info = () => {
      const [t, text, size] = TR_INFO[sel || 'intro'];
      $('#lab-tr-info', el).innerHTML = `<p class="lab-kicker">${sel ? 'Что это' : 'Как читать срез'}</p><h5>${t}</h5><p>${h.nb(text)}</p>${size ? `<p class="tr-size">${h.nb(size)}</p>` : ''}`;
    };
    const mark = () => {
      const scene = $('.tr-scene', ch.svg);
      if (!scene) return;
      scene.classList.toggle('has-sel', !!sel);
      $$('.mic-t', scene).forEach(g => g.classList.toggle('is-sel', g.dataset.t === sel));
      $$('.mic-label', scene).forEach(g => g.classList.toggle('is-sel', g.dataset.for === sel));
    };
    const pop = g => {
      const i = +g.dataset.i;
      if (burst.has(i)) return;
      burst.add(i);
      g.classList.add('is-burst');
      const r = g.getBoundingClientRect();
      S.aroma(layer, r.left + r.width / 2, r.top + r.height * 0.25);
      if (window.BasilHaptics) window.BasilHaptics.impact();
    };
    ch.svg.addEventListener('click', e => {
      const g = e.target.closest('.mic-t');
      if (!g) { sel = null; mark(); info(); return; }
      if (g.dataset.t === 'pel') pop(g);
      sel = sel === g.dataset.t && g.dataset.t !== 'pel' ? null : g.dataset.t;
      mark();
      info();
    });
    ch.svg.addEventListener('keydown', e => {
      const g = e.target.closest && e.target.closest('.tr-pel');
      if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); sel = 'pel'; pop(g); mark(); info(); }
    });
    const redraw = () => { ch.redraw(); mark(); };
    $('#lab-tr-rub', el).addEventListener('click', () => {
      const all = $$('.tr-pel', ch.svg).sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left);
      all.forEach((g, i) => setTimeout(() => pop(g), 120 + i * 170));
    });
    $('#lab-tr-reset', el).addEventListener('click', () => { burst.clear(); redraw(); });
    const note = () => set(el, 'lab-tr-note', light === 'sun'
      ? 'Лист на солнце толще: два слоя столбчатой ткани, пузыри железок полны масла.'
      : 'Лист в тени тоньше: один слой столбчатой ткани, масла в железках меньше — и аромат слабее.');
    h.bindPick(el, 'lab-tr-light', v => { light = v; burst.clear(); redraw(); note(); age(ageV); });

    /* top view: jigsaw epidermis, glands as golden dots, stomata */
    const topSvg = $('#lab-tr-top', el);
    let ageV = 20;
    function age(a) {
      ageV = a;
      const k = 1 + a / 100 * 3;             // leaf has stretched k times
      const rnd = micro.rng(3);
      const cellPx = 17 * Math.sqrt(k);      // cells grow, but also still divide early on
      const cols = Math.ceil(200 / cellPx) + 2;
      const P = [];
      for (let r = 0; r <= cols; r++) for (let c = 0; c <= cols; c++) P.push([c * cellPx - cellPx + (rnd() - 0.5) * cellPx * 0.5, r * cellPx - cellPx + (rnd() - 0.5) * cellPx * 0.5]);
      const at = (c, r) => P[r * (cols + 1) + c];
      const wav = (a1, b1) => { const mx = (a1[0] + b1[0]) / 2, my = (a1[1] + b1[1]) / 2, dx = b1[0] - a1[0], dy = b1[1] - a1[1], n = (rnd() - 0.5) * 0.5; return `M${r1(a1[0])} ${r1(a1[1])}Q${r1(mx - dy * n)} ${r1(my + dx * n)} ${r1(mx)} ${r1(my)}T${r1(b1[0])} ${r1(b1[1])}`; };
      let walls = '';
      for (let r = 0; r < cols; r++) for (let c = 0; c < cols; c++) { walls += wav(at(c, r), at(c + 1, r)) + wav(at(c, r), at(c, r + 1)); }
      let t = `<defs><radialGradient id="lab-tr-dot" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="var(--mic-oil-hi)"/><stop offset=".5" stop-color="var(--mic-oil)"/><stop offset="1" stop-color="var(--mic-oil-deep)"/></radialGradient><clipPath id="lab-tr-clip"><rect width="200" height="200" rx="16"/></clipPath></defs>`;
      t += `<g clip-path="url(#lab-tr-clip)"><rect class="tr-surf" width="200" height="200"/><path class="tr-wall" d="${walls}"/>`;
      // stomata on the upper side are few; glands thin out as the leaf stretches
      const sunK = light === 'sun' ? 1 : 0.7;
      const n = Math.max(2, Math.round(26 * sunK / (k * k) * 3.2));
      const nCap = Math.max(1, Math.round(n * 0.8));
      const place = [];
      const spot = () => { for (let tries = 0; tries < 40; tries++) { const x = 12 + rnd() * 176, y = 12 + rnd() * 176; if (place.every(([px, py]) => Math.hypot(px - x, py - y) > 16)) { place.push([x, y]); return [x, y]; } } return [12 + rnd() * 176, 12 + rnd() * 176]; };
      for (let i = 0; i < 3; i++) { const [x, y] = spot(); t += `<g class="tr-sto" transform="translate(${r1(x)} ${r1(y)}) rotate(${Math.round(rnd() * 180)})"><ellipse cx="-2.6" rx="2.6" ry="5.4"/><ellipse cx="2.6" rx="2.6" ry="5.4"/><path d="M0 -3.6V3.6"/></g>`; }
      for (let i = 0; i < nCap; i++) { const [x, y] = spot(); t += `<circle class="tr-capdot" cx="${r1(x)}" cy="${r1(y)}" r="2.6"/>`; }
      const R = 7.5 * Math.min(1.25, 0.9 + a / 250);
      for (let i = 0; i < n; i++) {
        const [x, y] = spot();
        t += `<g class="tr-peldot"><circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(R + 1.6)}" class="tr-pelrim"/><circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(R)}" fill="url(#lab-tr-dot)"/><path d="M${r1(x - R * 0.7)} ${r1(y)}H${r1(x + R * 0.7)}M${r1(x)} ${r1(y - R * 0.7)}V${r1(y + R * 0.7)}" class="tr-pelx"/><ellipse cx="${r1(x - R * 0.35)}" cy="${r1(y - R * 0.4)}" rx="${r1(R * 0.3)}" ry="${r1(R * 0.18)}" class="tr-pelhi"/></g>`;
      }
      for (let i = 0; i < 2; i++) { const [x, y] = spot(); t += `<path class="tr-hairtop" d="M${r1(x)} ${r1(y)}q ${r1(14 + rnd() * 8)} ${r1(-4 - rnd() * 6)} ${r1(26 + rnd() * 8)} ${r1(-2)}"/>`; }
      t += '</g>';
      topSvg.innerHTML = t;
      set(el, 'lab-tr-cap', `${a < 30 ? 'молодой верхний лист' : a < 70 ? 'лист среднего возраста' : 'старый нижний лист'}: ≈ ${n} ${h.plural(n, 'пельтатная железка', 'пельтатные железки', 'пельтатных железок')} на этом участке`);
    }
    h.bindRange(el, 'lab-tr-age', a => a < 30 ? 'молодой' : a < 70 ? 'средний' : 'старый', age);
    note();
    info();
    age(20);
  });

  register('pathway', el => {
    // the tree as drawn on a wide screen: x as a share of the width, y in pixels
    const NODES = {
      sug: [0.53, 30, 'Сахара фотосинтеза'], ipp: [0.32, 100, 'IPP и DMAPP · C₅'], gpp: [0.19, 176, 'ГДФ · C₁₀'], fpp: [0.455, 176, 'ФДФ · C₁₅'], ger: [0.315, 256, 'Гераниол'],
      phe: [0.74, 100, 'Фенилаланин · C₉'], cia: [0.74, 176, 'Коричная кислота'], con: [0.74, 256, 'Кониферилацетат'], chv: [0.595, 256, 'Хавикол']
    };
    const ENDS = { lin: [0.07, 256], cin: [0.19, 256], cit: [0.315, 336], car: [0.455, 256], est: [0.595, 336], mci: [0.915, 256], eug: [0.74, 336], meu: [0.74, 416] };
    const PATHS = {
      lin: ['sug', 'ipp', 'gpp', 'lin'], cin: ['sug', 'ipp', 'gpp', 'cin'], cit: ['sug', 'ipp', 'gpp', 'ger', 'cit'], car: ['sug', 'ipp', 'fpp', 'car'],
      est: ['sug', 'phe', 'cia', 'chv', 'est'], mci: ['sug', 'phe', 'cia', 'mci'], eug: ['sug', 'phe', 'cia', 'con', 'eug'], meu: ['sug', 'phe', 'cia', 'con', 'eug', 'meu']
    };
    const ENZ = { 'gpp-lin': 'LIS', 'gpp-cin': 'CinS', 'gpp-ger': 'GES', 'ger-cit': 'ADH', 'fpp-car': 'TPS', 'phe-cia': 'PAL', 'cia-mci': 'CCMT', 'chv-est': 'CVOMT', 'con-eug': 'EGS', 'eug-meu': 'EOMT', 'cia-chv': '', 'cia-con': '' };
    const INFO = {
      lin: ['Линалоол', 'Линалоолсинтаза (LIS) превращает геранилдифосфат в линалоол одним шагом. Её активность — главное отличие европейских сортов.', 'генуэзский, греческий, фиолетовые, «Пурпурный шар»'],
      cin: ['1,8-Цинеол', 'Цинеолсинтаза (CinS) замыкает геранилдифосфат в бициклический эфир.', 'генуэзский, африканский синий'],
      cit: ['Цитраль', 'Гераниолсинтаза (GES) даёт гераниол, а дегидрогеназы (ADH) окисляют его до альдегидов гераниаля и нераля — вместе это цитраль.', 'лимонный, лаймовый'],
      car: ['β-Кариофиллен', 'Сесквитерпенсинтазы (TPS) сворачивают пятнадцатиуглеродный фарнезилдифосфат в кольца.', 'тулси, лимонный'],
      est: ['Эстрагол', 'Хавикол-O-метилтрансфераза (CVOMT) пришивает метильную группу к хавиколу. Сильный фермент — анисовый тайский базилик.', 'тайский, фиолетовые, «Арарат», «Анисовый восторг»'],
      mci: ['Метилциннамат', 'Метилтрансфераза коричной кислоты (CCMT) превращает её в метиловый эфир с запахом корицы и клубники.', 'коричный; по аромату — «Карамельный»'],
      eug: ['Эвгенол', 'Эвгенолсинтаза (EGS) снимает ацетатную группу с кониферилацетата — получается эвгенол.', 'генуэзский, гвоздичный, тулси, «Философ», «Василиск»'],
      meu: ['Метилэвгенол', 'Эвгенол-O-метилтрансфераза (EOMT) метилирует эвгенол. Много её у тулси.', 'тулси']
    };
    const TERP = ['lin', 'cin', 'cit', 'car'], PHEN = ['est', 'mci', 'eug', 'meu'];
    const short = k => h.molName(k).replace(/^1,8-|^β-/, '');
    el.innerHTML = h.head('Два конвейера аромата', 'Базилик собирает аромат на двух конвейерах: терпены — из пятиуглеродных «кирпичиков», фенилпропаноиды — из аминокислоты фенилаланина. Выберите молекулу, чтобы увидеть её путь и ферменты на каждом шаге.') +
      `<div class="pw-pick" id="lab-pw-pick" role="group" aria-label="Молекула">${TERP.concat(PHEN).map(k => `<button type="button" class="chip pw-chip" data-k="${k}" aria-pressed="false"><i style="background:var(--m-${k})"></i>${short(k)}</button>`).join('')}</div>
       <div class="lab-chart pw-chart" id="lab-pw-ch"></div>
       <div class="pw-info" id="lab-pw-info" aria-live="polite"></div>`;
    let sel = 'eug';
    const pill = (x, y, w, text, cls, k, mk) => `<g class="${cls}"${mk ? ` style="--mk:var(--m-${mk})"` : ''}${k ? ` data-k="${k}" tabindex="0" role="button" aria-label="${text}"` : ''}>${k ? `<rect class="pw-hit" x="${r1(x - w / 2)}" y="${y - 21}" width="${r1(w)}" height="42"/>` : ''}<rect x="${r1(x - w / 2)}" y="${y - 15}" width="${r1(w)}" height="30" rx="${k ? 10 : 15}"/><text x="${r1(x)}" y="${y + 4.5}" text-anchor="middle">${text}</text></g>`;
    const tw = (t, big) => t.length * (big ? 8.1 : 7.6) + 20;
    const arrow = (x1, y1, x2, y2, hot, enz, side = 1) => {
      let s = `<line class="pw-edge${hot ? ' is-hot' : ''}" x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}" marker-end="url(#lab-pw-ah${hot ? '-hot' : ''})"/>`;
      if (enz) {
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, ew = enz.length * 7 + 10;
        s += `<g class="pw-tag${hot ? ' is-hot' : ''}" data-fit="5"><rect x="${r1(mx - ew / 2)}" y="${r1(my - 8)}" width="${r1(ew)}" height="16" rx="8"/><text class="pw-enz${hot ? ' is-hot' : ''}" x="${r1(mx)}" y="${r1(my + 4)}" text-anchor="middle">${enz}</text></g>`;
      }
      return s;
    };
    const ch = h.chart($('#lab-pw-ch', el), {
      label: 'Схема биосинтеза ароматических веществ базилика',
      h: w => (w >= 700 ? 440 : 88 + 70 * (Math.max(TERP.includes(sel) ? PATHS[sel].length - 1 : 3, PHEN.includes(sel) ? PATHS[sel].length - 1 : 4) - 1) + 58),
      draw(w, hh) {
        const path = PATHS[sel], on = new Set(path), edges = new Set(path.slice(1).map((b, i) => path[i] + '-' + b));
        let s = `<defs>${['', '-hot'].map(k => `<marker id="lab-pw-ah${k}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L10 5 L0 10 z" class="pw-ah${k ? ' is-hot' : ''}"/></marker>`).join('')}</defs>`;
        if (w >= 700) {
          const X = f => Math.round(f * w);
          const pos = k => (NODES[k] || ENDS[k]);
          const width = k => (NODES[k] ? tw(NODES[k][2]) : tw(short(k), true));
          const E = [['sug', 'ipp'], ['sug', 'phe'], ['ipp', 'gpp'], ['ipp', 'fpp'], ['gpp', 'lin'], ['gpp', 'cin'], ['gpp', 'ger'], ['ger', 'cit'], ['fpp', 'car'], ['phe', 'cia'], ['cia', 'mci'], ['cia', 'chv'], ['cia', 'con'], ['chv', 'est'], ['con', 'eug'], ['eug', 'meu']];
          s += `<rect class="pw-lane" x="6" y="62" width="${X(0.53) - 16}" height="${hh - 70}" rx="18"/><rect class="pw-lane is-phen" x="${X(0.53) + 6}" y="62" width="${w - X(0.53) - 12}" height="${hh - 70}" rx="18"/>`;
          s += `<text class="pw-zone" x="18" y="${hh - 18}">терпены</text><text class="pw-zone" x="${w - 18}" y="${hh - 18}" text-anchor="end">фенилпропаноиды</text>`;
          E.forEach(([a, b]) => {
            const A = pos(a), B = pos(b), hot = edges.has(a + '-' + b);
            let x1 = X(A[0]), y1 = A[1] + 16, x2 = X(B[0]), y2 = B[1] - 17;
            if (Math.abs(A[1] - B[1]) < 8) { x1 = X(A[0]) + width(a) / 2; y1 = A[1]; x2 = X(B[0]) - width(b) / 2 - 4; y2 = B[1]; }
            s += arrow(x1, y1, x2, y2, hot, ENZ[a + '-' + b], x2 >= x1 ? 1 : -1);
          });
          Object.entries(NODES).forEach(([k, [f, y, t]]) => { s += pill(X(f), y, width(k), t, `pw-node${on.has(k) ? ' is-hot' : ''}`); });
          Object.entries(ENDS).forEach(([k, [f, y]]) => { s += pill(Math.min(w - width(k) / 2 - 4, Math.max(width(k) / 2 + 4, X(f))), y, width(k), short(k), `pw-end${k === sel ? ' is-sel' : ''}${on.has(k) ? ' is-hot' : ''}`, k, k); });
          return s;
        }
        // phone: two conveyors side by side, each shows the chain that leads to the chosen molecule
        const cx = [w * 0.26, w * 0.74], cw = w * 0.46;
        s += `<rect class="pw-lane" x="2" y="52" width="${r1(w / 2 - 6)}" height="${hh - 56}" rx="16"/><rect class="pw-lane is-phen" x="${r1(w / 2 + 4)}" y="52" width="${r1(w / 2 - 6)}" height="${hh - 56}" rx="16"/>`;
        s += pill(w / 2, 24, tw('Сахара фотосинтеза'), 'Сахара фотосинтеза', 'pw-node is-hot');
        [[TERP, ['ipp', 'gpp', 'lin'], 'терпены'], [PHEN, ['phe', 'cia', 'con', 'eug'], 'фенилпропаноиды']].forEach(([group, fallback, name], c) => {
          const mine = group.includes(sel);
          const chain = mine ? PATHS[sel].slice(1) : fallback;
          const x = cx[c];
          s += arrow(w / 2 + (c ? 30 : -30), 40, x, 70, mine, '', 1);
          chain.forEach((k, i) => {
            const y = 88 + i * 70;
            const isEnd = !NODES[k];
            const text = isEnd ? short(k) : NODES[k][2].replace(' · ', ' ');
            s += pill(x, y, Math.min(cw - 8, tw(text, isEnd)), text, `${isEnd ? 'pw-end' : 'pw-node'}${mine ? ' is-hot' : ' is-idle'}${k === sel ? ' is-sel' : ''}`, isEnd && mine ? k : null, isEnd ? k : null);
            if (i < chain.length - 1) s += arrow(x, y + 16, x, y + 53, mine, ENZ[k + '-' + chain[i + 1]], 1);
          });
          s += `<text class="pw-zone" x="${r1(x)}" y="${hh - 12}" text-anchor="middle">${name}</text>`;
        });
        return s;
      }
    });
    const info = () => {
      const inf = INFO[sel];
      $('#lab-pw-info', el).innerHTML = `<p class="lab-kicker">${TERP.includes(sel) ? 'Терпеновый конвейер' : 'Фенилпропаноидный конвейер'}</p><h5>${inf[0]}</h5><p>${h.nb(inf[1])}</p><p class="pw-sorts">Много у сортов: ${inf[2]}</p>`;
      $$('.pw-chip', el).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.k === sel)));
    };
    const choose = k => { if (!k || !INFO[k]) return; sel = k; ch.redraw(); info(); };
    $('#lab-pw-pick', el).addEventListener('click', e => { const b = e.target.closest('.pw-chip'); if (b) choose(b.dataset.k); });
    ch.svg.addEventListener('click', e => { const g = e.target.closest('.pw-end[data-k]'); if (g) choose(g.dataset.k); });
    ch.svg.addEventListener('keydown', e => { const g = e.target.closest && e.target.closest('.pw-end[data-k]'); if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); choose(g.dataset.k); } });
    info();
  });

  register('molecules', el => {
    const ids = Object.keys(h.MOLS).sort((a, b) => h.MOLS[a].bp - h.MOLS[b].bp);
    el.innerHTML = `<div class="mol-lab">
      <div class="mol-view"><div class="mol-stage"><canvas class="mol-canvas" id="lab-mol-cv" role="img" aria-label="Трёхмерная модель молекулы"></canvas><span class="mol-hint hand" aria-hidden="true" data-on-picture>покрутите</span></div>
        <p class="mol-key"><span><i class="mk-c"></i>углерод</span><span><i class="mk-o"></i>кислород</span><span class="muted">водороды скрыты</span></p></div>
      <div class="mol-card" id="lab-mol-card" aria-live="polite"></div>
    </div>
    <div class="chips-row lab-chips mol-chips" id="lab-mol-chips" role="group" aria-label="Молекулы">${ids.map(id => `<button class="chip" type="button" data-v="${id}" aria-pressed="${id === 'lin'}"><i class="fam-dot ${h.FAM[h.MOLS[id].fam].cls}"></i>${h.MOLS[id].name}</button>`).join('')}</div>
    <div class="vol-scale" aria-label="Шкала летучести по температуре кипения">
      <div class="vol-track">${ids.map((id, i) => { const m = h.MOLS[id]; return `<button type="button" class="vol-chip ${h.FAM[m.fam].cls}" data-v="${id}" style="--x:${((m.bp - 115) / 160 * 100).toFixed(1)}%;--mc:var(--m-${id})"><b>${m.name.replace(/^\(Z\)-3-/, '')}</b><small>${m.bp} °C</small></button>`; }).join('')}</div>
      <div class="vol-axis"><span>верхние ноты · улетают первыми</span><span>сердце</span><span>база · держатся дольше</span></div>
    </div>
    <ul class="legend">${Object.values(h.FAM).map(f => `<li><i class="fam-dot ${f.cls}"></i>${f.name}</li>`).join('')}</ul>`;
    const viewer = h.MolViewer($('#lab-mol-cv', el), 'lin');
    const card = id => {
      const m = h.MOLS[id];
      $('#lab-mol-card', el).innerHTML = `<p class="lab-kicker">${m.cls}</p><h4 class="mol-name">${m.name}</h4>${m.alt ? `<p class="mol-alt">${m.alt}</p>` : ''}
        <p class="mol-formula">${h.sub(m.formula)} · кипит при ${m.bp} °C</p>
        <dl class="data-rows"><div><dt>Пахнет</dt><dd>${m.smell}</dd></div><div><dt>Есть также в</dt><dd>${m.where}</dd></div><div><dt>Сорта базилика</dt><dd>${m.basil}</dd></div></dl>
        <p>${h.nb(m.note)}</p>`;
      $$('[data-v]', el).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === id)));
    };
    el.addEventListener('click', e => { const b = e.target.closest('[data-v]'); if (!b || !el.contains(b)) return; viewer.set(b.dataset.v); card(b.dataset.v); });
    card('lin');
    const track = $('.vol-track', el);
    const layout = () => {
      const W = track.clientWidth;
      if (!W) return;
      const rows = [];
      $$('.vol-chip', track).forEach(c => {
        const w = c.offsetWidth, x = parseFloat(c.style.getPropertyValue('--x')) / 100 * W;
        const left = clamp(x - w / 2, 4, W - w - 4);
        let r = rows.findIndex(end => end + 6 < left);
        if (r < 0) { rows.push(0); r = rows.length - 1; }
        rows[r] = left + w;
        c.style.left = left + 'px';
        c.style.translate = '0 0';
        c.style.top = (8 + r * 42) + 'px';
      });
      track.style.height = (rows.length * 42 + 12) + 'px';
    };
    layout();
    if ('ResizeObserver' in window) new ResizeObserver(layout).observe(track);
  });

  // the same order everywhere: families stay together, so a colour never jumps between charts
  const CH_ORDER = ['lin', 'cin', 'cit', 'cam', 'est', 'meu', 'eug', 'mci', 'car', 'ber'];
  // what the nose makes of each molecule: axis weights of the «character» chart
  const CH_AXES = [['floral', 'цветы'], ['lemon', 'лимон'], ['cool', 'холодок'], ['pepper', 'перец'], ['clove', 'гвоздика'], ['cinnamon', 'корица'], ['anise', 'анис']];
  const CH_NOTE = {
    lin: { floral: 1 }, cit: { lemon: 1 }, cin: { cool: 1 }, cam: { cool: 1, pepper: 0.25 },
    car: { pepper: 1 }, ber: { pepper: 0.8 }, eug: { clove: 1 }, meu: { clove: 0.6, anise: 0.5 },
    mci: { cinnamon: 1, floral: 0.2 }, est: { anise: 1 }
  };
  const chScore = p => CH_AXES.map(([a]) => Math.min(1, Math.sqrt(Object.entries(p).reduce((s, [m, v]) => s + v * ((CH_NOTE[m] || {})[a] || 0), 0) / 55)));
  const chShort = k => h.molName(k).replace(/^1,8-|^α-|^β-/, '').toLowerCase();

  register('chemotype', el => {
    const V = h.CHEMO;
    // the catalogue's sorts, each under its chemotype (window.BASIL comes from data.js)
    const SORTS = (window.BASIL && window.BASIL.VARIETIES) || [];
    const sortsOf = i => SORTS.map((v, k) => [v, k]).filter(([v]) => v.chem === V[i].id);
    const q2 = t => `«${t}»`;
    el.innerHTML = h.head('Химический отпечаток сорта', 'Кольцо — из чего состоит эфирное масло, паутинка — каким от этого получается запах. Доли — ориентир по опубликованным анализам: у каждого растения они свои и меняются с погодой.') +
      `<div class="chemo-grid">
        <div class="chemo-card">
          <div class="chemo-figs">
            <div class="chemo-fig"><div class="lab-chart" id="lab-ch-donut"></div><ol class="chemo-top" id="lab-ch-top"></ol></div>
            <div class="chemo-fig"><div class="lab-chart" id="lab-ch-radar"></div></div>
          </div>
          <div class="chemo-info" id="lab-ch-info" aria-live="polite"></div>
        </div>
        <div class="chemo-side">
          <p class="lab-label">Химотипы и сорта</p>
          <div class="chemo-list" id="lab-ch-list" role="group" aria-label="Химотипы и сорта базилика">${V.map((r, i) => `<div class="chemo-group"><button type="button" class="chemo-row" data-i="${i}" aria-pressed="${i === 0}"><span class="chemo-name">${r.name}</span><span class="chemo-bar">${CH_ORDER.filter(k => r.p[k]).map(k => `<i data-m="${k}" style="flex-grow:${r.p[k]};background:var(--m-${k})"></i>`).join('')}<i class="is-rest" style="flex-grow:${Math.max(0, 100 - CH_ORDER.reduce((a, k) => a + (r.p[k] || 0), 0))}"></i></span><b class="chemo-val"></b></button>${sortsOf(i).length ? `<div class="chemo-sorts">${sortsOf(i).map(([v, k]) => `<button type="button" class="chemo-sort lf-${v.leaf}" data-s="${k}" aria-pressed="false"><i></i>${v.name.replace(/, святой базилик$/, '')}</button>`).join('')}</div>` : ''}</div>`).join('')}</div>
          <p class="lab-label">Молекулы</p>
          <div class="chemo-mols" id="lab-ch-mols" role="group" aria-label="Подсветить молекулу">${CH_ORDER.map(k => `<button type="button" class="chip chemo-mol" data-m="${k}" aria-pressed="false"><i style="background:var(--m-${k})"></i>${chShort(k)}</button>`).join('')}</div>
          <p class="lab-foot">зелёные — монотерпены, лиловые и коричные — фенилпропаноиды, золотистые — сесквитерпены; серое — остальные вещества</p>
        </div>
      </div>`;
    let cur = 0, mol = null, sort = null;
    const title = () => (sort != null ? SORTS[sort].name : V[cur].name);
    const shares = i => CH_ORDER.map(k => [k, V[i].p[k] || 0]);

    /* composition ring: every molecule has its own arc, so switching sorts slides the arcs */
    const donut = h.chart($('#lab-ch-donut', el), {
      label: 'Состав эфирного масла выбранного сорта',
      h: w => Math.min(w, 200),
      draw(w, hh) {
        const S0 = Math.min(w, hh), cx = w / 2, cy = hh / 2, r = S0 * 0.36, sw = S0 * 0.16;
        let s = `<circle class="chemo-ring-bg" cx="${cx}" cy="${cy}" r="${r1(r)}" stroke-width="${r1(sw)}"/>`;
        s += `<g transform="rotate(-90 ${r1(cx)} ${r1(cy)})">`;
        CH_ORDER.forEach(k => { s += `<circle class="chemo-seg" data-m="${k}" cx="${r1(cx)}" cy="${r1(cy)}" r="${r1(r)}" stroke="var(--m-${k})" stroke-width="${r1(sw)}"/>`; });
        s += '</g>';
        s += `<text class="chemo-c1" id="lab-ch-c1" x="${r1(cx)}" y="${r1(cy - 4)}" text-anchor="middle"></text><text class="chemo-c2" id="lab-ch-c2" x="${r1(cx)}" y="${r1(cy + 16)}" text-anchor="middle"></text>`;
        return s;
      }
    });
    const paintDonut = () => {
      const c = $('.chemo-seg', donut.svg);
      if (!c) return;
      const R = +c.getAttribute('r'), C = 2 * Math.PI * R;
      let at = 0;
      shares(cur).forEach(([k, v]) => {
        const len = v / 100 * C, seg = $(`.chemo-seg[data-m="${k}"]`, donut.svg);
        seg.style.strokeDasharray = `${r1(Math.max(0, len - (len > 3 ? 2 : 0)))} ${r1(C)}`;
        seg.style.strokeDashoffset = r1(-at);
        seg.classList.toggle('is-dim', !!mol && mol !== k);
        at += len;
      });
      const [k, v] = mol ? [mol, V[cur].p[mol] || 0] : shares(cur).sort((a, b) => b[1] - a[1])[0];
      set(el, 'lab-ch-c1', `${v} %`);
      set(el, 'lab-ch-c2', chShort(k));
    };

    /* character of the smell: seven notes, the classic Genovese dashed for comparison */
    let shown = chScore(V[0].p), anim = 0, radarPt = null;
    const radar = h.chart($('#lab-ch-radar', el), {
      label: 'Характер запаха выбранного сорта по семи нотам',
      h: w => Math.min(260, Math.max(220, w * 0.72)),
      draw(w, hh) {
        const cx = w / 2, cy = hh / 2 + 4, R = Math.min(w / 2 - 60, hh / 2 - 28);
        const pt = (i, v) => { const a = -Math.PI / 2 + i * 2 * Math.PI / CH_AXES.length; return [cx + Math.cos(a) * R * v, cy + Math.sin(a) * R * v]; };
        let s = '';
        [0.25, 0.5, 0.75, 1].forEach(g => { s += `<polygon class="chemo-web" points="${CH_AXES.map((_, i) => pt(i, g).map(r1).join(',')).join(' ')}"/>`; });
        CH_AXES.forEach(([, name], i) => {
          const [x, y] = pt(i, 1), [lx, ly] = pt(i, 1.16);
          s += `<line class="chemo-axis" x1="${r1(cx)}" y1="${r1(cy)}" x2="${r1(x)}" y2="${r1(y)}"/>`;
          const anchor = Math.abs(lx - cx) < 8 ? 'middle' : lx > cx ? 'start' : 'end';
          s += `<text class="chemo-ax" x="${r1(lx)}" y="${r1(ly + (ly > cy + 4 ? 10 : ly < cy - R * 0.9 ? -2 : 4))}" text-anchor="${anchor}">${name}</text>`;
        });
        s += `<polygon class="chemo-ref" id="lab-ch-ref" points=""/><polygon class="chemo-shape" id="lab-ch-shape" points=""/><g id="lab-ch-pts"></g>`;
        radarPt = pt;
        return s;
      }
    });
    const drawShape = vals => {
      const pt = radarPt;
      if (!pt || !radar) return;
      const shape = $('#lab-ch-shape', radar.svg), ref = $('#lab-ch-ref', radar.svg);
      shape.setAttribute('points', vals.map((v, i) => pt(i, Math.max(0.04, v)).map(r1).join(',')).join(' '));
      ref.setAttribute('points', cur ? chScore(V[0].p).map((v, i) => pt(i, Math.max(0.04, v)).map(r1).join(',')).join(' ') : '');
      $('#lab-ch-pts', radar.svg).innerHTML = vals.map((v, i) => { const [x, y] = pt(i, Math.max(0.04, v)); return `<circle class="chemo-pt" cx="${r1(x)}" cy="${r1(y)}" r="3.4"/>`; }).join('');
    };
    const tweenTo = target => {
      cancelAnimationFrame(anim);
      const from = shown.slice(), t0 = performance.now(), dur = h.reduce.matches ? 0 : 420;
      const step = t => {
        const k = dur ? Math.min(1, (t - t0) / dur) : 1, e = 1 - Math.pow(1 - k, 3);
        shown = from.map((v, i) => lerp(v, target[i], e));
        drawShape(shown);
        if (k < 1) anim = requestAnimationFrame(step);
      };
      anim = requestAnimationFrame(step);
    };

    const info = () => {
      const r = V[cur];
      const top = shares(cur).filter(([, v]) => v).sort((a, b) => b[1] - a[1]);
      $('#lab-ch-top', el).innerHTML = top.slice(0, 4).map(([k, v]) => `<li><i style="background:var(--m-${k})"></i><span>${chShort(k)}</span><b>${v}&nbsp;%</b></li>`).join('');
      if (mol) {
        const M = h.MOLS[mol] || h.EXTRA[mol];
        const best = V.map((x, i) => [i, x.p[mol] || 0]).sort((a, b) => b[1] - a[1])[0];
        const bestSorts = sortsOf(best[0]).map(([v]) => q2(v.name.replace(/, святой базилик$/, ''))).slice(0, 4);
        $('#lab-ch-info', el).innerHTML = `<p class="lab-kicker">Молекула</p><h5>${h.molName(mol)}</h5><p>${h.nb(`Пахнет: ${M.smell}. У сорта ${q2(title())} — ${r.p[mol] ? r.p[mol] + ' %' : 'почти нет'}; больше всего — у химотипа ${q2(V[best[0]].name)}, ${best[1]} %${bestSorts.length ? ': ' + bestSorts.join(', ') : ''}.`)}</p>`;
      } else {
        // where the numbers come from: an analysis of this type, or the sort is placed here by its descent or aroma
        const s = sort != null ? SORTS[sort] : null;
        const note = !s ? `Сорта этого химотипа: ${sortsOf(cur).map(([v]) => q2(v.name.replace(/, святой базилик$/, ''))).join(', ') || '—'}.`
          : s.chemBy === 'analysis' ? (s.name === r.name ? '' : `Состав — по анализам сортов группы ${q2(r.name)}.`)
          : `Отдельного анализа масла у этого сорта нет: состав показан по химотипу ${q2(r.name)}, к которому его относит ${s.chemBy === 'type' ? 'происхождение' : 'аромат'} — ${s.chemWhy}.`;
        $('#lab-ch-info', el).innerHTML = `<p class="lab-kicker">${s ? 'Почему так пахнет' : 'Химотип'}</p><h5>${title()}</h5>${s ? `<p class="chemo-aroma">${h.nb(s.aroma)}</p>` : ''}<p>${h.nb(r.why)}</p>${note ? `<p class="chemo-note">${h.nb(note)}</p>` : ''}${cur ? '<p class="chemo-cmp"><i></i>пунктир — генуэзский для сравнения</p>' : ''}`;
      }
    };
    const list = $('#lab-ch-list', el);
    const paintList = () => {
      list.dataset.m = mol || '';
      $$('.chemo-row', list).forEach(b => {
        const i = +b.dataset.i;
        b.setAttribute('aria-pressed', String(i === cur && sort == null));
        b.classList.toggle('is-cur', i === cur);
        $('.chemo-val', b).textContent = mol ? (V[i].p[mol] ? V[i].p[mol] + ' %' : '—') : '';
      });
      $$('.chemo-sort', list).forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.s === sort)));
      $$('.chemo-mol', el).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.m === mol)));
    };
    const update = () => { paintDonut(); tweenTo(chScore(V[cur].p)); info(); paintList(); };
    list.addEventListener('click', e => {
      const sb = e.target.closest('.chemo-sort');
      if (sb) { sort = +sb.dataset.s; cur = V.findIndex(g => g.id === SORTS[sort].chem); update(); return; }
      const b = e.target.closest('.chemo-row');
      if (b) { cur = +b.dataset.i; sort = null; update(); }
    });
    $('#lab-ch-mols', el).addEventListener('click', e => { const b = e.target.closest('.chemo-mol'); if (b) { mol = mol === b.dataset.m ? null : b.dataset.m; update(); } });
    // charts rebuild on resize: put the current state back
    if ('ResizeObserver' in window) new ResizeObserver(() => { paintDonut(); drawShape(shown); }).observe(el);
    update();
  });

  register('heat', el => {
    // any sort of the catalogue; its oil is that of its chemotype
    const SORTS = ((window.BASIL && window.BASIL.VARIETIES) || []).filter(x => h.CHEMO.some(g => g.id === x.chem));
    // the list keeps the catalogue's types: a group per type, its varieties inside
    const TYPES = (window.BASIL && window.BASIL.VARIETY_TYPES) || [];
    const opt = (x, k) => `<option value="${k}">${x.name.replace(/, святой базилик$/, '')}</option>`;
    const sortOptions = () => {
      const pairs = SORTS.map((x, k) => [x, k]);
      const groups = TYPES.map(t => [t, pairs.filter(([x]) => x.type === t.id)]).filter(([, list]) => list.length);
      const rest = pairs.filter(([x]) => !TYPES.some(t => t.id === x.type));
      return groups.map(([t, list]) => `<optgroup label="${t.name}">${list.map(([x, k]) => opt(x, k)).join('')}</optgroup>`).join('') + rest.map(([x, k]) => opt(x, k)).join('');
    };
    el.innerHTML = h.head('Когда класть базилик', 'Модель открытой кастрюли: скорость потери каждой молекулы пропорциональна давлению её пара, оценённому по правилу Трутона. Внизу — что останется от аромата выбранного сорта.', true) +
      `<div class="lab-controls lab-row-wrap"><div class="field lab-field heat-sort"><label for="lab-ht-v">Сорт</label><select id="lab-ht-v">${sortOptions()}</select></div>${h.segHtml('lab-ht-t', 'Нагрев', [['60', '60 °C'], ['80', '80 °C'], ['100', 'Кипение']], '100')}${h.rangeHtml('lab-ht-m', 'Время на огне', 0, 30, 0.5, 10)}</div>
       <div class="heat-rows" id="lab-ht-rows"></div>
       <ul class="legend">${Object.values(h.FAM).map(f => `<li><i class="fam-dot ${f.cls}"></i>${f.name}</li>`).join('')}<li><i class="fam-dot is-ghost"></i>было в свежем листе</li></ul>` +
      h.readHtml([['Осталось аромата', 'lab-ht-tot'], ['Характер', 'lab-ht-c', 'is-wide']]);
    const st = { v: 'genovese', T: 100, m: 10 };
    const upd = () => {
      const prof = Object.assign({ hex: 3 }, h.CHEMO.find(c => c.id === st.v).p);
      const ids = Object.keys(prof).filter(k => h.MOLS[k]).sort((a, b) => h.MOLS[a].bp - h.MOLS[b].bp);
      const T = st.T + 273.15;
      const sum0 = ids.reduce((a, k) => a + prof[k], 0);
      let sum1 = 0; const rest = {};
      ids.forEach(k => { const P = Math.exp(10.6 * (1 - (h.MOLS[k].bp + 273.15) / T)); const f = Math.exp(-1.48 * P * st.m); rest[k] = f; sum1 += prof[k] * f; });
      const mx = Math.max(...ids.map(k => prof[k]));
      $('#lab-ht-rows', el).innerHTML = ids.map(k => {
        const m = h.MOLS[k];
        return `<div class="heat-row"><span class="heat-name"><b>${m.name.replace(/^\(Z\)-3-/, '')}</b><small>${m.bp} °C</small></span>
          <span class="heat-bar"><i class="heat-ghost" style="--w:${prof[k] / mx * 100}%"></i><i class="heat-fill ${h.FAM[m.fam].cls}" style="--w:${prof[k] * rest[k] / mx * 100}%"></i></span>
          <span class="heat-val">${pct(rest[k])}</span></div>`;
      }).join('');
      set(el, 'lab-ht-tot', pct(sum1 / sum0));
      const lost = k => rest[k] < 0.5;
      const tone = [];
      if (st.m === 0) tone.push('свежий лист: все ноты на месте');
      else {
        if (lost('lin') && prof.lin > 10) tone.push('цветочная нота линалоола ушла');
        if (lost('cin')) tone.push('исчез освежающий холодок цинеола');
        if (rest.eug > 0.6 && prof.eug > 5) tone.push('осталась тёплая гвоздика эвгенола');
        if (rest.est > 0.5 && prof.est > 20) tone.push('анис эстрагола держится');
        if (rest.mci > 0.6 && prof.mci) tone.push('корица метилциннамата стойкая');
        if (prof.cit && lost('cit')) tone.push('лимон цитраля заметно ослаб');
        if (!tone.length) tone.push('аромат почти не изменился');
      }
      set(el, 'lab-ht-c', h.nb(tone.join('; ').replace(/^./, c => c.toUpperCase()) + '.' + (st.m > 5 && st.T >= 80 ? ' Кладите свежий базилик в последние 1–2 минуты или прямо в тарелку.' : '')));
    };
    $('#lab-ht-v', el).addEventListener('change', e => { st.v = (SORTS[+e.target.value] || {}).chem || 'genovese'; upd(); });
    h.bindPick(el, 'lab-ht-t', v => { st.T = +v; upd(); });
    h.bindRange(el, 'lab-ht-m', v => `${fmt(v)} мин`, v => { st.m = v; upd(); });
    upd();
  });

  const PH_NAMES = [[3, 'красный', 'катион флавилия: молекула заряжена положительно и поглощает зелёный свет'], [5.5, 'бледно-розовый', 'часть молекул перешла в бесцветную карбинольную форму'], [7.5, 'фиолетовый', 'хиноидное основание — нейтральная окрашенная форма'], [10.5, 'синий, сине-зелёный', 'анионное хиноидное основание'], [15, 'жёлто-зелёный', 'кольцо раскрылось в халкон — пигмент необратимо разрушается']];

  register('anthocyanin', el => {
    el.innerHTML = h.head('Фиолетовый базилик и pH', 'Настой фиолетового базилика — природный индикатор, как краснокочанная капуста. Добавьте кислоту или щёлочь.') +
      `<div class="lab-grid anth-grid">
        <svg class="anth-jar" viewBox="0 0 140 170" aria-hidden="true">
          <path class="jar-glass" d="M30 20 H110 V150 Q110 162 98 162 H42 Q30 162 30 150 Z"/>
          <path id="lab-an-liq" d="M33 60 Q70 54 107 60 V149 Q107 159 97 159 H43 Q33 159 33 149 Z"/>
          <use href="#pl-leaf" class="pl-leaf anth-leaf" style="fill:url(#pl-grad-purple)" transform="translate(58 140) rotate(-20) scale(.42)"/>
          <use href="#pl-leaf" class="pl-leaf anth-leaf" style="fill:url(#pl-grad-purple)" transform="translate(84 146) rotate(28) scale(.36)"/>
          <path class="jar-shine" d="M40 32 V140"/>
        </svg>
        <div class="lab-controls">${h.rangeHtml('lab-an-ph', 'pH', 1, 12, 0.1, 7)}${h.chipsHtml('lab-an-q', 'Добавить', [['2.2', 'Лимонный сок'], ['2.8', 'Уксус'], ['7', 'Вода'], ['8.3', 'Пищевая сода'], ['10.5', 'Мыльная вода']], '7')}
          <p class="anth-out" id="lab-an-out" aria-live="polite"></p></div>
      </div>`;
    const stops = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => h.css('--ph-' + n) || '#888');
    const upd = ph => {
      const col = h.ramp([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => h.css('--ph-' + n) || stops[n - 1]), (ph - 1) / 11);
      $('#lab-an-liq', el).style.fill = col;
      const nm = PH_NAMES.find(p => ph < p[0]);
      $('#lab-an-out', el).innerHTML = `<b>pH ${fmt(ph)}: ${nm[1]}.</b> ${h.nb(nm[2])}.`;
    };
    const rng = h.bindRange(el, 'lab-an-ph', v => fmt(v), upd);
    h.bindPick(el, 'lab-an-q', v => rng.set(+v));
    upd(7);
  });

  /* @use food */
  // how much each molecule matters in the food's own aroma (1 — one of its key notes)
  const PA_W = {
    tomato: { hex: 1, lin: 0.5 }, strawberry: { mci: 0.8, lin: 0.7 }, lemon: { cit: 1, lin: 0.4 }, peach: { lin: 0.7 },
    coriander: { lin: 1 }, fennel: { est: 1 }, clove: { eug: 1, cin: 0.6 }, pepper: { car: 1 }, rosemary: { cin: 1, cam: 0.9 },
    mint: { cin: 0.6 }, cocoa: { lin: 0.5 }, olive: { hex: 0.6 }, cucumber: { hex: 0.5 }
  };
  // pairs that work by contrast: what does the work, and which basil it suits best
  const PA_LEVERS = {
    olive: [['жир', 'растворяет терпены и держит аромат']],
    cucumber: [['свежесть', 'холодная водянистая мякоть']],
    mozzarella: [['жир', 'растворяет и продлевает аромат'], ['молочная свежесть', 'оттеняет пряность']],
    parmesan: [['умами', 'глутамат выдержанного сыра'], ['соль', 'ярче слышен аромат'], ['жир', 'держит терпены']],
    garlic: [['сера', 'острота из аллицина'], ['масло', 'смягчает остроту']],
    chili: [['жгучесть', 'капсаицин'], ['кокосовый жир', 'держит эстрагол']]
  };
  const PA_FIT = {
    olive: { genovese: 1, greek: 0.95, purple: 0.9, clove: 0.9, lemon: 0.85, lime: 0.85, cinnamon: 0.8, thai: 0.75, tulsi: 0.7, african: 0.6 },
    cucumber: { lemon: 1, lime: 1, genovese: 0.9, greek: 0.85, cinnamon: 0.7, thai: 0.65, purple: 0.6, clove: 0.5, tulsi: 0.45, african: 0.4 },
    mozzarella: { genovese: 1, greek: 0.95, lemon: 0.8, lime: 0.75, purple: 0.7, cinnamon: 0.7, clove: 0.6, thai: 0.45, tulsi: 0.4, african: 0.35 },
    parmesan: { genovese: 1, greek: 0.9, purple: 0.8, clove: 0.7, cinnamon: 0.5, lemon: 0.5, lime: 0.45, thai: 0.3, tulsi: 0.35, african: 0.3 },
    garlic: { genovese: 1, greek: 0.9, purple: 0.9, clove: 0.8, thai: 0.7, tulsi: 0.6, cinnamon: 0.45, lemon: 0.5, lime: 0.5, african: 0.35 },
    chili: { thai: 1, tulsi: 0.9, lemon: 0.8, lime: 0.8, purple: 0.6, clove: 0.55, genovese: 0.45, greek: 0.45, cinnamon: 0.4, african: 0.3 }
  };
  const PA_HEX = 12; // green-leaf aldehydes burst out of any basil the moment it is cut

  register('pairing', el => {
    const V = h.CHEMO, P = h.PAIRS;
    // every sort of the catalogue; its chemotype decides the numbers
    const SORTS = ((window.BASIL && window.BASIL.VARIETIES) || []).filter(x => V.some(g => g.id === x.chem));
    const groupOf = k => Math.max(0, V.findIndex(g => g.id === SORTS[k].chem));
    const sortName = x => x.name.replace(/, святой базилик$/, '');
    const share = (v, m) => (m === 'hex' ? PA_HEX : V[v].p[m] || 0);
    const bridge = (v, m, w) => w * Math.min(1, Math.sqrt(share(v, m) / 40));
    // no shared molecules: the pair works by contrast (olive oil and cucumber only share a family of green notes)
    const contrast = f => !f.mols.length;
    const score = (v, f) => {
      if (contrast(f)) return (PA_FIT[f.id] || {})[V[v].id] || 0.5;
      return 1 - Object.entries(PA_W[f.id]).reduce((a, [m, w]) => a * (1 - 0.85 * bridge(v, m, w)), 1);
    };
    const word = (x, c) => c ? (x >= 0.8 ? 'отличный контраст' : x >= 0.55 ? 'хороший контраст' : 'спорно') : x >= 0.6 ? 'сильная связь' : x >= 0.35 ? 'заметная связь' : x >= 0.15 ? 'слабая связь' : 'почти нет';
    const vShort = n => n.replace('Африканский синий', 'Африк. синий');
    // the basil is chosen in two steps: its type (as in the catalogue), then a variety of that type
    const TYPES = ((window.BASIL && window.BASIL.VARIETY_TYPES) || []).filter(t => SORTS.some(x => x.type === t.id));
    let sk = 0, ty = SORTS[0] && SORTS[0].type;
    const leafIco = x => `<svg viewBox="-34 -108 68 122" aria-hidden="true">${food.basil(x.leaf)}</svg>`;
    const typeChips = () => TYPES.map(t => { const first = SORTS.find(x => x.type === t.id); return `<button type="button" class="chip pa-type" data-t="${t.id}" aria-pressed="${t.id === ty}">${leafIco(first)}${t.short}<small>${SORTS.filter(x => x.type === t.id).length}</small></button>`; }).join('');
    const sortChips = () => SORTS.map((x, k) => [x, k]).filter(([x]) => !TYPES.length || x.type === ty).map(([x, k]) => `<button type="button" class="chip pa-var" data-s="${k}" aria-pressed="${k === sk}">${leafIco(x)}${vShort(sortName(x))}</button>`).join('');

    el.innerHTML = h.head('Лаборатория сочетаний', 'Выберите свой базилик — продукты выстроятся по силе связи с ним. Нажмите на продукт: мост покажет, какие молекулы их роднят или что работает на контрасте. Сила связи — качественная оценка по долям общих молекул.') +
      `<p class="lab-label">Ваш базилик</p>
       ${TYPES.length ? `<div class="pa-types" id="lab-pa-t" role="group" aria-label="Тип базилика">${typeChips()}</div>` : ''}
       <div class="pa-varieties" id="lab-pa-v" role="group" aria-label="Сорт базилика">${sortChips()}</div>
       <p class="lab-label">С чем сочетать</p>
       <div class="pa-foods" id="lab-pa-f" role="group" aria-label="Продукты"></div>
       <div class="pa-stage">
         <p class="pa-title" id="lab-pa-title"></p>
         <div class="lab-chart pa-chart" id="lab-pa-ch"></div>
         <div class="pa-info" id="lab-pa-info" aria-live="polite"></div>
       </div>`;
    let v = groupOf(0), cur = P[0];
    const foods = $('#lab-pa-f', el);
    foods.innerHTML = P.map(f => `<button type="button" class="pa-food" data-id="${f.id}" aria-pressed="${f.id === cur.id}">${food.icon(f.id, 'pa-ico')}<span class="pa-name">${f.name}</span><span class="pa-meter"><i></i></span><span class="pa-word"></span></button>`).join('');

    /* the bridge: basil — molecules (or what works by contrast) — the food */
    const ch = h.chart($('#lab-pa-ch', el), {
      label: 'Мост ароматов между базиликом и выбранным продуктом',
      h: () => Math.max(190, 70 + ((PA_W[cur.id] ? Object.keys(PA_W[cur.id]).length : 0) + (PA_LEVERS[cur.id] || []).length) * 80),
      draw(w, hh) {
        const narrow = w < 520, cy = hh / 2 + 6;
        const Lx = narrow ? 40 : 88, Rx = w - (narrow ? 40 : 88), mx = w / 2;
        const W = PA_W[cur.id] || {};
        const mols = Object.keys(W);
        const levers = PA_LEVERS[cur.id] || [];
        const nodes = mols.map(m => ({ m, a: bridge(v, m, 1), b: W[m] })).concat(levers.map(([t, s]) => ({ lever: t, sub: s })));
        const n = nodes.length, gap = Math.min(78, (hh - 40) / Math.max(1, n));
        let s = '', top = '';
        nodes.forEach((d, i) => {
          const y = cy + (i - (n - 1) / 2) * gap;
          const col = d.m ? `var(--m-${d.m})` : 'var(--ink-3)';
          const wa = d.m ? 1.5 + 11 * d.a : 2, wb = d.m ? 1.5 + 11 * d.b : 2;
          const faint = d.m && d.a < 0.18;
          s += `<path class="pa-rib${d.lever || faint ? ' is-dash' : ''}" pathLength="1" d="M${Lx + (narrow ? 10 : 14)} ${r1(cy - 8)}C${r1((Lx + mx) / 2)} ${r1(cy - 8)} ${r1((Lx + mx) / 2)} ${r1(y)} ${r1(mx - 24)} ${r1(y)}" stroke="${col}" stroke-width="${r1(wa)}"/>`;
          s += `<path class="pa-rib${d.lever ? ' is-dash' : ''}" pathLength="1" d="M${r1(mx + 24)} ${r1(y)}C${r1((mx + Rx) / 2)} ${r1(y)} ${r1((mx + Rx) / 2)} ${r1(cy - 8)} ${Rx - (narrow ? 16 : 22)} ${r1(cy - 8)}" stroke="${col}" stroke-width="${r1(wb)}"/>`;
          // the molecule and what it is, above every ribbon: the ribbons of the others pass under its plate
          if (d.m) {
            const r = 9 + 9 * Math.max(d.a, 0.15);
            const name = d.m === 'hex' ? 'зелёные альдегиды' : h.molName(d.m).replace(/^1,8-|^α-|^β-/, '').toLowerCase();
            const sub2 = d.m === 'hex' ? 'при разрезе листа' : faint ? 'в этом сорте почти нет' : `${share(v, d.m)} % масла`;
            const tw = Math.max(name.length * 7.2, sub2.length * 6.4) + 16;
            top += `<circle class="pa-node${faint ? ' is-faint' : ''}" cx="${r1(mx)}" cy="${r1(y)}" r="${r1(r)}" fill="${col}" stroke="${col}"/>`;
            // above the nodes over the point where the ribbons meet, below the others: outside the fan of ribbons
            const up = y < cy - 8, ty = up ? y - r - 34 : y + r + 1;
            top += `<g class="pa-tag" data-fit="7"><rect x="${r1(mx - tw / 2)}" y="${r1(ty)}" width="${r1(tw)}" height="33" rx="9"/><text class="pa-mol" x="${r1(mx)}" y="${r1(ty + 14)}" text-anchor="middle">${name}</text><text class="pa-sub" x="${r1(mx)}" y="${r1(ty + 28)}" text-anchor="middle">${sub2}</text></g>`;
          } else {
            const tw = d.lever.length * 7.4 + 22;
            top += `<rect class="pa-lever" x="${r1(mx - tw / 2)}" y="${r1(y - 13)}" width="${r1(tw)}" height="26" rx="13"/><text class="pa-mol" x="${r1(mx)}" y="${r1(y + 4.5)}" text-anchor="middle">${d.lever}</text>`;
            top += `<g class="pa-tag" data-fit="7"><rect x="${r1(mx - 60)}" y="${r1(y + 16)}" width="120" height="15" rx="7"/><text class="pa-sub" x="${r1(mx)}" y="${r1(y + 27)}" text-anchor="middle">${d.sub}</text></g>`;
          }
        });
        s += top;
        s += `<g class="pa-end" transform="translate(${Lx} ${r1(cy + 26)})">${food.basil(SORTS[sk].leaf, narrow ? 0.5 : 0.62)}</g>`;
        s += `<g class="pa-end" transform="translate(${r1(Rx - (narrow ? 24 : 32))} ${r1(cy - 8 - (narrow ? 24 : 32))}) scale(${narrow ? 0.75 : 1})">${food.g(cur.id)}</g>`;
        return s;
      }
    });
    const drawIn = () => {
      const ribs = $$('.pa-rib', ch.svg);
      if (h.reduce.matches) return;
      ribs.forEach(p => { p.classList.remove('is-in'); });
      requestAnimationFrame(() => requestAnimationFrame(() => ribs.forEach((p, i) => { p.style.transitionDelay = `${(i % 2) * 0.28 + Math.floor(i / 2) * 0.06}s`; p.classList.add('is-in'); })));
    };

    const info = () => {
      const f = cur, x = score(v, f), c = contrast(f);
      const best = V.map((_, i) => [i, score(i, f)]).sort((a, b) => b[1] - a[1])[0];
      set(el, 'lab-pa-title', `<span>${sortName(SORTS[sk])}</span><i>+</i><span>${f.name.toLowerCase()}</span>`);
      const kicker = f.mols.length ? 'Общие молекулы' : f.kin && f.kin.length ? 'Родство ароматов' : 'Работает контраст';
      $('#lab-pa-info', el).innerHTML = `<p class="lab-kicker">${kicker}</p>
        <p class="pa-verdict"><b>${word(x, c)}</b>${best[0] !== v ? ` · лучше всего — ${SORTS.filter(y => y.chem === V[best[0]].id).slice(0, 3).map(y => `«${sortName(y)}»`).join(', ')}` : ' · лучший выбор для этой пары'}</p>
        ${SORTS[sk].chemBy !== 'analysis' ? `<p class="pa-note">${h.nb(`Связь посчитана по химотипу «${V[v].name}»: ${SORTS[sk].chemWhy}.`)}</p>` : ''}
        <p>${h.nb(f.why)}</p>
        <dl class="data-rows"><div><dt>Какой сорт</dt><dd>${f.variety}</dd></div><div><dt>Попробуйте</dt><dd>${f.dish}</dd></div></dl>`;
    };

    // cards: strongest first, contrast pairs after; they glide to their new places (FLIP)
    const order = () => {
      const cards = $$('.pa-food', foods);
      const first = new Map(cards.map(c => [c, c.getBoundingClientRect()]));
      const rank = P.map(f => ({ f, x: score(v, f), c: contrast(f) })).sort((a, b) => (a.c - b.c) || (b.x - a.x));
      rank.forEach(({ f, x, c }) => {
        const card = $(`.pa-food[data-id="${f.id}"]`, foods);
        card.style.setProperty('--v', x.toFixed(2));
        card.classList.toggle('is-contrast', c);
        $('.pa-word', card).textContent = word(x, c);
        foods.appendChild(card);
      });
      if (h.reduce.matches) return;
      cards.forEach(c => {
        const a = first.get(c), b = c.getBoundingClientRect();
        const dx = a.left - b.left, dy = a.top - b.top;
        if (!dx && !dy) return;
        c.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: 420, easing: 'cubic-bezier(.22,.8,.26,1)' });
      });
    };
    const pick = () => {
      $$('.pa-food', foods).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.id === cur.id)));
      ch.redraw();
      drawIn();
      info();
    };
    foods.addEventListener('click', e => { const b = e.target.closest('.pa-food'); if (!b) return; cur = P.find(p => p.id === b.dataset.id); pick(); });
    const choose = k => {
      sk = k;
      v = groupOf(sk);
      $$('.pa-var', el).forEach(x => x.setAttribute('aria-pressed', String(+x.dataset.s === sk)));
      order();
      foods.scrollTo({ left: 0, behavior: h.reduce.matches ? 'auto' : 'smooth' });
      pick();
    };
    $('#lab-pa-v', el).addEventListener('click', e => { const b = e.target.closest('.pa-var'); if (b) choose(+b.dataset.s); });
    // a type: its varieties take the second row, the first of them is chosen
    if (TYPES.length) $('#lab-pa-t', el).addEventListener('click', e => {
      const b = e.target.closest('.pa-type');
      if (!b || b.dataset.t === ty) return;
      ty = b.dataset.t;
      $$('.pa-type', el).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      const row = $('#lab-pa-v', el);
      sk = SORTS.findIndex(x => x.type === ty);
      row.innerHTML = sortChips();
      row.scrollTo({ left: 0 });
      choose(sk);
    });
    order();
    pick();
  });
})();
