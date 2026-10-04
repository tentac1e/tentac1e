# Карта кода

Файл собирает `scripts/build.py` при каждой сборке — не правьте руками. Содержание (главы, вкладки, модели, развороты) — в `MAP.md`, как работать с проектом — в `CLAUDE.md`. Ищите здесь по имени, прежде чем грепать исходники.

## Функции

Имена верхнего уровня каждого куска с номером строки. Куски одного модуля (`src/js/<модуль>/NN-*.js`) — одна область видимости: имя, объявленное в одном, видно во всех следующих.

### app.js
- `src/js/app/00-core.js`: `$` 6, `$$` 7, `clamp` 9, `f1` 10, `esc` 11, `nb` 26, `plural` 28, `fmtNum` 37, `addDays` 42, `fd` 43, `fr` 44, `toISO` 49, `fromISO` 50, `today` 54, `dayDiff` 55, `icon` 56, `chapterById` 57, `paintIll` 60, `pageOf` 69, `aliasOf` 77, `urlFor` 79, `fixLinks` 88, `smooth` 98, `toast` 101, `copyText` 110
- `src/js/app/01-theme.js`: `initTheme` 4
- `src/js/app/02-router.js`: `stickyOffset` 9, `homeView` 21, `ENTRY` 22, `resolve` 29, `activatePanel` 51, `updateChrome` 77, `jump` 104, `scrollAfter` 110, `route` 148, `navigate` 179, `initRouter` 187, `initPagers` 210, `initScrollChrome` 253
- `src/js/app/03-peek.js`: `decodeSafe` 10, `placeOf` 15, `placeUrl` 27, `frameSrc` 28, `peekable` 31, `peekShow` 50, `peekLoad` 64, `resetFrame` 71, `openPeek` 80, `goToPlace` 96, `peekPop` 112, `onPeekClosed` 121, `sendTheme` 131, `onPeekMessage` 135, `initPeek` 156, `toParent` 209, `markPeek` 212, `initPeekFrame` 242
- `src/js/app/03-sheets.js`: `openSheet` 8, `closeSheet` 30, `dragSheet` 57, `tocFold` 127, `tocPane` 132, `tocOpen` 137, `tocButton` 162, `initToc` 170, `initSheets` 193
- `src/js/app/04-search-words.js`: `norm` 4, `isWordChar` 6, `stemRu` 10, `keysOf` 48, `fromLayout` 63, `latinTyped` 64, `sameKey` 91, `altsOf` 93, `editDistance` 104, `nearestWord` 124
- `src/js/app/04-search.js`: `textOf` 4, `sectionOf` 19, `ownText` 30, `indexPage` 40, `sentences` 83, `buildSearchIndex` 85, `entryUrl` 114, `loadSearch` 120, `parseQuery` 140, `scanKey` 149, `scoreEntry` 172, `matchAll` 203, `vocabulary` 213, `runSearch` 223, `highlight` 259, `snippet` 273, `markFound` 286, `flashFound` 290, `fitSearchPanel` 310, `initSearch` 323
- `src/js/app/05-scene.js`: `initScene` 4, `initHoverLight` 25, `initOffscreenPause` 64, `initLeafField` 70
- `src/js/app/06-mini-plants.js`: `miniPlant` 4
- `src/js/app/07-home.js`: `showShort` 4, `initHome` 8
- `src/js/app/08-varieties.js`: `leafArt` 4, `labelCls` 15, `meter` 16, `sortPic` 19, `openVariety` 22, `initVarieties` 53, `scoreVariety` 186, `initQuiz` 208
- `src/js/app/09-places.js`: `initPlaces` 4
- `src/js/app/10-soil.js`: `initSoil` 4
- `src/js/app/11-calendar.js`: `autumnFrostOf` 5, `seasonFrosts` 11, `initCalendar` 16
- `src/js/app/12-light.js`: `initDli` 4
- `src/js/app/13-nutrients-elements.js`: `initElements` 12
- `src/js/app/14-nutrients-stages.js`: `initStages` 4
- `src/js/app/15-nutrients-plan.js`: `initPlan` 4
- `src/js/app/16-nutrients-npk.js`: `initNpk` 4
- `src/js/app/17-nutrients-dose.js`: `spoonFraction` 5, `spoonText` 15, `initDose` 21
- `src/js/app/18-pinching.js`: `initSim` 4
- `src/js/app/19-seeds.js`: `initGerm` 4
- `src/js/app/20-problems.js`: `initDiagnostics` 6
- `src/js/app/21-reference.js`: `initGlossary` 4, `initChecklist` 20, `initRecipes` 59
- `src/js/app/22-garden-exps.js`: `expDef` 7, `expRunning` 8, `expStep` 11, `expTasks` 19, `expWhen` 29, `expCard` 37
- `src/js/app/22-garden-ics.js`: `repeatEvery` 9, `plantEvents` 16, `icsDate` 35, `icsText` 36, `icsFold` 38, `guideUrl` 52, `eventTitle` 53, `gardenIcs` 54, `exportIcs` 72, `googleLink` 84
- `src/js/app/22-garden-photos.js`: `photoOpen` 7, `photoReq` 20, `photoPut` 25, `photoGet` 26, `photoDel` 27, `photoIds` 28, `photoShrink` 31, `fillPhotos` 47, `forgetPhoto` 59, `showPhoto` 65, `photosOut` 85, `photosIn` 96
- `src/js/app/22-garden-view.js`: `ago` 4, `taskWhen` 7, `plantPic` 15, `lastPhoto` 17, `plantMeta` 18, `taskHtml` 24, `notesHtml` 31, `shared` 33, `weekHtml` 34, `gardenCard` 43, `renderGardenBox` 53, `gardenDue` 81, `renderGardenHome` 87, `varietyOptions` 98, `renderGardenForm` 104, `insideHtml` 120, `growthData` 126, `niceTicks` 138, `axisTicks` 146, `growthCharts` 153, `renderGardenPlant` 174, `renderGardenSheet` 214, `openGarden` 234, `gardenFile` 246, `exportGarden` 252, `canShareFile` 263, `shareGarden` 264, `importGarden` 269, `gardenExtra` 298, `initGarden` 308
- `src/js/app/22-garden-weather.js`: `round2` 9, `wxSvp` 12, `wxPlace` 13, `wxCached` 16, `pad2` 23, `wxParse` 25, `wxRefresh` 42, `wxSearch` 64, `wxSetPlace` 72, `wxHere` 82, `fmtT` 90, `fillText` 91, `wxWhen` 93, `wxDays` 94, `wxTasks` 97, `wxAdvice` 118, `wxAge` 135, `wxStrip` 143
- `src/js/app/22-garden.js`: `gardenLoad` 7, `gardenSave` 11, `gardenVariety` 15, `weekOf` 17, `later` 18, `daysWord` 19, `plantTasks` 25, `plantWeek` 109, `plantStage` 118, `plantNote` 124, `plantDone` 128, `lastNote` 132
- `src/js/app/22-install.js`: `initInstall` 6
- `src/js/app/22-reading-pos.js`: `readPos` 9, `absTop` 14, `labelOf` 15, `currentAnchor` 23, `headingBefore` 35, `ownWords` 47, `readBlocks` 48, `normText` 55, `sentenceStart` 58, `sentenceEnd` 64, `pointIn` 70, `caretAt` 80, `coverTop` 86, `spotAt` 95, `spotOf` 126, `findSpot` 151, `firstLetter` 165, `spotTop` 172, `markSpot` 188, `holdTop` 238, `bookmarkHere` 258, `savePos` 273, `resumeTo` 280, `saveDetour` 331, `readDetour` 334, `dropDetour` 340, `wayBack` 343, `offerBack` 363, `offerReturn` 368, `offerResume` 373, `initReadingPos` 398, `initLinks` 436, `initPageAction` 445
- `src/js/app/23-boot.js`: `boot` 4

Общие помощники app.js — кто зовёт:
- `clamp` (00-core.js:9) — 10: 02-router, 05-scene, 08-varieties …
- `esc` (00-core.js:11) — 9: 02-router, 03-sheets, 04-search …
- `plural` (00-core.js:28) — 12: 08-varieties, 10-soil, 11-calendar …
- `fmtNum` (00-core.js:37) — 5: 10-soil, 12-light, 17-nutrients-dose …
- `addDays` (00-core.js:42) — 5: 11-calendar, 15-nutrients-plan, 22-garden-ics …
- `toISO` (00-core.js:49) — 5: 11-calendar, 15-nutrients-plan, 22-garden-view …
- `fromISO` (00-core.js:50) — 5: 11-calendar, 15-nutrients-plan, 22-garden-view …
- `today` (00-core.js:54) — 8: 07-home, 11-calendar, 15-nutrients-plan …
- `dayDiff` (00-core.js:55) — 5: 11-calendar, 15-nutrients-plan, 22-garden-view …
- `icon` (00-core.js:56) — 14: 02-router, 04-search, 07-home …
- `chapterById` (00-core.js:57) — 5: 02-router, 03-peek, 03-sheets …
- `paintIll` (00-core.js:60) — 4: 08-varieties, 09-places, 13-nutrients-elements …
- `aliasOf` (00-core.js:77) — 3: 02-router, 03-peek, 04-search
- `smooth` (00-core.js:98) — 6: 02-router, 08-varieties, 13-nutrients-elements …
- `toast` (00-core.js:101) — 4: 22-garden-ics, 22-garden-view, 22-install …
- `openSheet` (03-sheets.js:8) — 3: 03-peek, 08-varieties, 22-garden-view
- `closeSheet` (03-sheets.js:30) — 4: 02-router, 03-peek, 04-search …
- `miniPlant` (06-mini-plants.js:4) — 3: 07-home, 14-nutrients-stages, 22-garden-view
- `gardenLoad` (22-garden.js:7) — 3: 22-garden-exps, 22-garden-view, 22-garden-weather
- `later` (22-garden.js:18) — 3: 03-peek, 22-install, 22-reading-pos

### science.js
- `src/js/science/00-core.js`: `$` 4, `$$` 5, `clamp` 6, `lerp` 7, `minus` 8, `nf` 10, `fmt` 11, `fmt0` 12, `nb` 13, `esc` 14, `css` 15, `f1` 16, `icon` 17, `plural` 18, `sub` 19
- `src/js/science/01-colors.js`: `parseColor` 4, `toLin` 15, `toSrgb` 16, `toOklab` 17, `fromOklab` 24, `rgbStr` 30, `mix` 31, `ramp` 35
- `src/js/science/02-controls.js`: `rangeHtml` 4, `segHtml` 6, `chipsHtml` 8, `bindRange` 10, `bindPick` 17, `readHtml` 28, `head` 29
- `src/js/science/03-charts.js`: `fitLabels` 6, `chart` 27, `r1` 58, `plot` 60, `tip` 147
- `src/js/science/04-astronomy.js`: `decl` 5, `dayLength` 6, `h0` 13, `noonSun` 20
- `src/js/science/05-molecules.js`: `molName` 68, `molFam` 69, `seeded` 106, `embed` 108, `shape` 167, `rx` 170, `ry` 171, `mul` 172, `ortho` 174, `MolViewer` 187
- `src/js/science/06-labs-loader.js`: `register` 6, `url` 12, `own` 15, `parsed` 16, `script` 17, `ensureLabs` 34, `styleFor` 43, `styleOn` 44, `failed` 54, `pause` 60, `later` 63, `drain` 71, `mount` 87, `mountAll` 102, `illustrate` 115, `variants` 116, `draw` 118, `fitIll` 140, `painted` 144, `seen` 148, `drawDue` 153, `paint` 157, `ahead` 197, `early` 219
- `src/js/science/07-deep.js`: `animateDetails` 24, `setDepth` 45, `initDepthControl` 67, `initDeep` 124, `initHomeMolecule` 181, `init` 216

Общие помощники science.js — кто зовёт:
- `clamp` (00-core.js:6) — 4: 01-colors, 03-charts, 04-astronomy …

### scene.js
- `src/js/scene/00-core.js`: `clamp` 4, `lerp` 5, `now` 6, `css` 7
- `src/js/scene/01-budget.js`: `setLow` 8, `setState` 22, `check` 34, `poke` 41, `onWake` 50, `gate` 52, `calmTick` 69, `loop` 82
- `src/js/scene/02-noise.js`: `rnd` 5, `fade` 12, `h3` 13, `noise3` 14
- `src/js/scene/03-wind.js`: `gust` 5, `gustAt` 9, `wind` 17
- `src/js/scene/04-background.js`: `leafPath` 7, `paintLeaf` 18, `makeCanvas` 58, `sprite` 66, `initBackground` 80
- `src/js/scene/05-plant.js`: `mk` 6, `f2` 12, `basil` 16, `bush` 32
- `src/js/scene/06-plant-bitmaps.js`: `themeKey` 10, `leafBitmaps` 11, `Plant` 38
- `src/js/scene/07-aroma.js`: `aroma` 9

Общие помощники scene.js — кто зовёт:
- `lerp` (00-core.js:5) — 3: 02-noise, 04-background, 06-plant-bitmaps
- `now` (00-core.js:6) — 3: 03-wind, 04-background, 06-plant-bitmaps
- `basil` (05-plant.js:16) — 3: 01-budget, 04-background, 06-plant-bitmaps

### data.js
- `src/js/data/10-experiments.js`: `expDay` 4

### Отдельные файлы
- `src/js/haptics.js`: `iosTap` 20, `play` 34, `watchSnap` 69, `initSnaps` 82, `dragTicker` 94
- `src/labs/_frame.js`: `r1` 8, `pct` 9, `set` 12, `doyToday` 13, `doyLabel` 14, `citiesChips` 15
- `src/labs/formirovka/_shared.js`: `pinchP` 5
- `src/labs/moy/_shared.js`: `EXP_DEF` 17, `two` 18, `localISO` 19, `fromLocal` 20, `whenText` 21, `sinceText` 23, `nfmt` 30, `expRid` 31, `expX` 33, `expVal` 35, `expSeries` 38, `expCross` 40, `expPlot` 52, `expTimeTicks` 63, `expFx` 69, `experiment` 71
- `src/labs/posadka/_shared.js`: `young` 7, `placeP` 110, `basilBush` 111, `tomato` 112
- `src/labs/problemy/_shared.js`: `bg` 7, `ground` 8, `sun` 9, `drop` 10, `gnat` 11, `Sc` 12, `downyZoom` 42, `greyZoom` 70, `fusZoom` 86, `rootsZoom` 97, `dampZoom` 113, `bactZoom` 124, `caption` 150, `aphidBig` 158, `miteBig` 164, `whiteflyBig` 172, `thripsBig` 178, `slugBig` 188, `gnatBig` 197
- `src/labs/razmnozhenie/_shared.js`: `cutting` 6
- `src/labs/sorta/_shared.js`: `lookOf` 8, `blade` 21, `stemOf` 22, `paper` 23, `sprig` 26, `sortPic` 37, `lead` 47, `typePic` 58
- `src/labs/udobreniya/_shared.js`: `OLD` 7, `defPic` 23
- `src/labs/uhod/_shared.js`: `waterP` 7, `potCut` 9
- `src/labs/urozhay/_shared.js`: `storeP` 6, `cutSprig` 8
- `src/labs/_lib/agro.js` (`agro`): `svp` 6, `vpd` 8, `zoneOf` 10, `germDays` 15, `along` 20, `rootsOnset` 25, `rootsLength` 27, `osmoticMPa` 30
- `src/labs/_lib/food.js` (`food`): `F` 5, `hi` 6, `leaf` 7, `dots` 8, `has` 95, `g` 96, `icon` 97, `basil` 101
- `src/labs/_lib/ills.js` (`ill`): `q` 6, `F` 7, `id` 12, `HW` 13, `Ys` 14, `inside` 15, `mix` 16, `outline` 19, `veinEnd` 45, `veins` 46, `bay` 56, `leaf` 67, `aphid` 201, `mite` 211, `whitefly` 219, `thrips` 225, `web` 231, `spike` 241, `plant` 253, `bush` 284, `ballBush` 313, `pot` 332, `seedling` 339, `label` 352, `scale` 353, `svg` 355
- `src/labs/_lib/micro.js` (`micro`): `rng` 5, `q` 6, `smooth` 8, `cell` 18, `dots` 28, `lining` 37, `section` 48, `peltate` 173, `capitate` 197, `hair` 208, `labels` 233, `pill` 253, `scale` 257
- `src/labs/_lib/props.js` (`props`): `P` 9, `shine` 10, `paper` 14, `ground` 15, `step` 17, `tray` 21, `seed` 38, `sprout` 40, `shoot` 60, `cupSoil` 81, `cup` 82, `shopPot` 92, `crowd` 101, `roots` 111, `rootball` 123, `sprayer` 137, `can` 147, `lamp` 158, `thermo` 167, `lid` 173, `scissors` 185, `cutMark` 194, `knife` 196, `lens` 201, `bottle` 209, `glass` 220, `jar` 231, `iceTray` 243, `bunch` 255, `envelope` 271, `bowl` 280, `mortar` 289, `saucepan` 296, `bag` 304, `window_` 313, `balcony` 327, `bed` 334, `greenhouse` 342, `tank` 353, `tree` 366, `sun` 370, `moon` 371, `drop` 373, `seedSpike` 378, `calyx` 390, `bee` 395, `snow` 399, `fridge` 409, `finger` 421, `arrow` 425, `dim` 430

## Стили

Какие семейства классов красит файл (самые частые первыми) и его анимации `@keyframes`.

### style.css
- `src/css/style/01-base.css`: `.skip`, `.eyebrow`, `.num`, `.mono`, `.muted`, `.ico`, `.sprite`, `.lead`, `.hand`
- `src/css/style/02-ambient.css`: `.aura`, `.sky-*`, `.is-off`, `.is-asleep`, `.page`, `.wrap` · анимации: `drift`, `sky-breathe`, `sky-sway`, `sky-moon`
- `src/css/style/03-header.css`: `.search-*`, `.tab-*`, `.garden-*`, `.brand`, `.topbar-*`, `.is-active`, `.progress`, `.ico`, `.icon-*`, `.tabbar`
- `src/css/style/04-controls.css`: `.btn-*`, `.field-*`, `.seg`, `.range`, `.chip`, `.row-*`, `.g-link`, `.table-*`, `.bare`, `.wide-*`, `.ico`, `.chips-*`
- `src/css/style/05-views.css`: `.js`, `.view`, `.is-active`, `.panel`, `.is-entering`, `.steps`, `.step`, `.storage`, `.card`, `.ref-*`, `.principles`, `.myths` · анимации: `vt-out`, `vt-in`, `panel-in`, `rise`
- `src/css/style/06-blocks.css`: `.table-*`, `.mini-*`, `.callout`, `.ticks`, `.stack`, `.chart-*`, `.sub-*`, `.data-*`, `.two-*`, `.ico`, `.is-warn`, `.group` · анимации: `toast-in`
- `src/css/style/07-chapter-art.css`: `.ar-leaf-*`, `.ar-rim-*`, `.ar-hl-*`, `.ar-can-*`, `.ar-lid-*`, `.ar-lens-*`, `.ar-paper`, `.ar-band`, `.ar-zig`, `.ar-line`, `.ar-coty`, `.ar-seed`
- `src/css/style/08-home.css`: `.facts`, `.toc-*`, `.hero-*`, `.home-*`, `.short-*`, `.journey`, `.passport-*`, `.q-card`, `.season-*`, `.rule-*`, `.continue`, `.tool` · анимации: `breathe`, `spin`, `bob`, `sway-all`, `leaf-sway`
- `src/css/style/09-chapter-chrome.css`: `.ch-hero-*`, `.subnav-*`, `.pager`, `.blob`, `.art-*`, `.is-stuck`, `.pg-art`, `.eyebrow`, `.lead`, `.next` · анимации: `morph`, `morph-fade`
- `src/css/style/10-varieties.css`: `.quiz-*`, `.v-leaf`, `.vtype`, `.vt-panel-*`, `.meter`, `.vt-specs`, `.vt-sorts`, `.vd-head`, `.qr`, `.versus`, `.filters`, `.vt-toggle` · анимации: `vt-in`
- `src/css/style/11-places.css`: `.place-*`, `.params`, `.tab`, `.comp-*`, `.tabs`, `.ill`, `.lead`
- `src/css/style/12-steps.css`: `.step-*`, `.soil-*`, `.ill-*`, `.rescue-*`, `.steps`, `.mx-a`, `.mx-b`, `.mx-c`, `.mx-d`
- `src/css/style/13-calendar.css`: `.cal-*`, `.legend`, `.timeline`, `.wheel-*`, `.tl-mark`, `.tl-dot`, `.tl-body`, `.w-center-*`, `.tl-date`, `.w-arc`, `.w-ev`, `.is-key`
- `src/css/style/14-care.css`: `.dli-*`, `.scale-*`, `.mix-*`, `.water-*`, `.season`, `.soil-*`, `.big`, `.is-single`, `.z-dead`, `.z-cold`, `.z-slow`, `.z-ok`
- `src/css/style/15-fertilizers.css`: `.stage-*`, `.npk-*`, `.plan-*`, `.dose-*`, `.el-tile`, `.mob-*`, `.radio-*`, `.el-sym`, `.el-legend`, `.el-section`, `.mini-*`, `.principle`
- `src/css/style/16-pinching.css`: `.sim-*`, `.doubling`, `.s-node`, `.diagram-*`, `.stat`, `.pinch-*`, `.cut-*`, `.hit`, `.dot`, `.is-bad`, `.card`, `.ill` · анимации: `node-pulse`, `pop`
- `src/css/style/17-harvest.css`: `.recipe-*`, `.store-*`, `.germ-*`, `.ingredients`, `.third-*`, `.storage`, `.ill`, `.term`, `.t-cut`, `.t-keep`, `.hand`, `.recipes-*`
- `src/css/style/18-problems.css`: `.diag-*`, `.ref-*`, `.cause-*`, `.prob`, `.eyebrow`, `.hint`, `.causes`, `.p-high`, `.p-mid`, `.p-low`, `.ill`, `.latin`
- `src/css/style/19-reference.css`: `.check-*`, `.faq-*`, `.gloss-*`, `.bar`, `.glossary`, `.ico`
- `src/css/style/20-footer.css`: `.footer-*`, `.to-top`, `.brand`, `.is-shown`
- `src/css/style/21-sheets.css`: `.sheet-*`, `.peek-*`, `.search-*`, `.sr-item`, `.is-closing`, `.ico`, `.sr-more`, `.sr-recent`, `.is-loading`, `.sr-group`, `.sr-note`, `.sr-ico` · анимации: `sheet-in`, `fade-in`, `sheet-up`, `peek-paper`, `peek-in`, `search-in`, `is-found`
- `src/css/style/22-selection.css`: `.depth-*`, `.lab-*`, `.sim-*`, `.btn`, `.chip`, `.seg`, `.nav`, `.subnav`, `.tabbar`, `.toc`, `.pager`, `.deep-*`
- `src/css/style/23-garden.css`: `.exp-*`, `.g-pic-*`, `.g-task-*`, `.g-step-*`, `.g-log-*`, `.ico`, `.g-install-*`, `.g-empty`, `.g-photo-*`, `.g-form-*`, `.g-link`, `.photo-*`
- `src/css/style/24-toc.css`: `.toc-*`, `.tools-*`, `.sheet-*`, `.ico`, `.is-open`, `.garden-*`, `.is-closing`, `.tool`, `.t-where`, `.is-on` · анимации: `toc-drop`
- `src/css/style/25-peek.css`: `.is-peek`, `.deep-*`, `.topbar`, `.footer`, `.tabbar`, `.to-top`, `.skip`, `.aura`, `.resume-*`, `.ch-hero`, `.subnav-*`, `.pager`

### lab.css
- `src/css/lab/00-ill.css`: `.ill-*` · анимации: `ill-in`
- `src/css/lab/00-micro.css`: `.mic-*`, `.is-burst`, `.is-pale`, `.is-film`, `.is-cap`, `.is-done`, `.has-*`, `.is-sel` · анимации: `mic-fly`
- `src/css/lab/00-tokens.css`: `.sr-only`
- `src/css/lab/01-hero.css`: `.pot-*`, `.hero-*`, `.aroma-*`, `.plant-*`, `.passport`, `.pl-stem-*`, `.pl-leaf`, `.is-purple`, `.pl-scar`, `.pl-pet`, `.pl-fold`, `.pl-shine` · анимации: `aroma-rise`, `label-rise`
- `src/css/lab/03-deep-switch.css`: `.deep-*`
- `src/css/lab/04-deep-index.css`: `.deep-*`, `.lab-*`, `.ico`, `.ch-hero`
- `src/css/lab/05-deep.css`: `.deep-*`, `.chel-*`, `.num-*`, `.ico`, `.eq`, `.ph-strip`, `.ticks`, `.chem`, `.eq-label`, `.eq-enz`, `.margin-*`, `.aside-*`
- `src/css/lab/06-lab-tools.css`: `.lab-*`, `.zone-*`, `.gdd-*`, `.fam-*`, `.line`, `.legend`, `.range`, `.band-*`, `.s1`, `.s2`, `.s3`, `.mol-*` · анимации: `shimmer`
- `src/css/lab/07-vkus.css`: `.world-*`, `.cols-*`, `.kitchen-*`
- `src/css/lab/08-home-science.css`: `.sh-kinds`, `.sh-mol`, `.sh-text`, `.science-*`, `.mol-*`, `.eyebrow`, `.is-total`, `.ico`, `.chips-*`, `.chip`
- `src/css/lab/09-hover-light.css`: `.ch-hero-*`, `.aroma-*`, `.germ-*`, `.deep-*`, `.q-card`, `.tool`, `.rule`, `.art-*`, `.ar-wisp`, `.ar-mol`, `.ar-o`, `.ar-c` · анимации: `fade-out`
- `src/css/lab/10-depth.css`: `.depth-*`, `.deep-*` · анимации: `pop-in`
- `src/css/lab/11-deep-footer.css`: `.deeper-*`, `.deep-*`, `.eq`, `.is-deeper`
- `src/css/lab/12-sci-notes.css`: `.sci-*`, `.ico`, `.hand`
- `src/css/lab/13-recipes.css`: `.recipe-*`, `.is-feat`, `.rc-sci-*`, `.ico`, `.rc-ico`, `.rb-intro`, `.rb-filter`, `.rc-sum`, `.deep-*`, `.rc-facts`, `.chip`, `.rc-title`
- `src/css/lab/14-paint.css`: `.plant-*`, `.lab-*`, `.is-off`, `.pl-stems`, `.osm-*`, `.xylem`, `.phloem`, `.barrel-*`, `.nc-flow`, `.germ-*`
- `src/css/lab/15-nav-helpers.css`: `.resume-*`, `.panel-*`, `.depth-*`, `.ico`, `.hap-*`, `.continue`, `.is-shown`, `.is-bar` · анимации: `resume-mark`

### стили моделей и глав
- `src/labs/formirovka/auxin.css`: `.aux-*`, `.is-on`, `.auxin-*`, `.lab-*`
- `src/labs/moy/_shared.css`: `.exp-*`, `.btn`, `.is-done`, `.is-now`, `.is-missed`, `.s1`, `.s2`, `.s3`, `.g-link`, `.ico`, `.is-model`, `.is-empty`
- `src/labs/moy/weather.css`: `.wx-day`, `.wx-vpd`, `.lab-*`, `.band`, `.wx-find-*`, `.wx-place-*`, `.wx-n`, `.is-hot`, `.wx-pick`, `.wx-x`, `.wx-r`, `.wx-s`
- `src/labs/posadka/germ.css`: `.germ-*`, `.is-stopped` · анимации: `g-gel`, `g-root`, `g-hypo`, `g-coty`
- `src/labs/posadka/perched.css`: `.per-*`, `.tick`, `.is-water`
- `src/labs/posadka/shade.css`: `.rfr-*`, `.shade-*`, `.lab-*`
- `src/labs/posadka/window.css`: `.win-*`
- `src/labs/problemy/aphid.css`: `.ap-grid`, `.ap-shoot`
- `src/labs/problemy/dm.css`: `.dm-gauge`, `.dm-leaf`, `.dm-out`, `.g-track`, `.g-low`, `.g-mid`, `.g-high`, `.g-needle`, `.g-hub`, `.dm-level`, `.ill-*`, `.dm-cap`
- `src/labs/problemy/pigment.css`: `.pg-out`, `.pg-verdict`, `.pg-leaf`
- `src/labs/razmnozhenie/roots.css`: `.roots-*`, `.rt-glass`, `.rt-water`, `.rt-wl`, `.rt-stem`, `.rt-node`, `.rt-root`
- `src/labs/razmnozhenie/seedlife.css`: `.sl-scale`
- `src/labs/udobreniya/barrel.css`: `.stave-*`, `.barrel-*`, `.is-limit`, `.lab-*`, `.is-sel`, `.hoop`
- `src/labs/udobreniya/ec.css`: `.ec-zone`, `.is-bad`, `.ec-name`, `.ec-needle`, `.ec-chart`, `.ec-track`, `.ec-lead`, `.ec-tick`, `.ec-val`
- `src/labs/udobreniya/flows.css`: `.chl-*`, `.flows-*`, `.xylem`, `.phloem`, `.roots`, `.fl-tag`, `.tick`
- `src/labs/udobreniya/ncycle.css`: `.nc-edge`, `.is-off`, `.nc-lbl`, `.nc-root-*`, `.nc-flow`, `.nc-bugs`, `.nc-plate`, `.nc-chart`, `.nc-air`, `.nc-surface`, `.nc-crumbs`, `.nc-water` · анимации: `nc-run`
- `src/labs/udobreniya/osmos.css`: `.osm-*` · анимации: `flow-dash`
- `src/labs/udobreniya/oxide.css`: `.ox-real`, `.ox-val`, `.ox-row`, `.ox-name`, `.ox-bars`, `.lab-*`, `.ox-rows`, `.ox-pack`, `.s1`, `.s2`, `.s3`
- `src/labs/uhod/ph.css`: `.ph-band`, `.is-low`, `.ph-sym`
- `src/labs/uhod/vpd.css`: `.vpd-*`, `.z0`, `.z1`, `.z2`, `.z3`, `.z4`
- `src/labs/urozhay/pesto.css`: `.pesto-*`
- `src/labs/vkus/anthocyanin.css`: `.anth-*`
- `src/labs/vkus/chemotype.css`: `.chemo-*`, `.lab-*`, `.is-dim`, `.is-rest`, `.is-cur`, `.lf-deep`, `.lf-purple`, `.lf-thai`, `.lf-lime`
- `src/labs/vkus/heat.css`: `.heat-*`, `.s1`, `.s2`, `.s3`, `.s4`
- `src/labs/vkus/molecules.css`: `.vol-*`, `.mol-*`, `.mk-c`, `.mk-o`
- `src/labs/vkus/pairing.css`: `.pa-food`, `.pa-type`, `.pa-rib`, `.pa-varieties`, `.pa-foods`, `.pa-var`, `.pa-meter`, `.is-contrast`, `.pa-title`, `.pa-types`, `.pa-stage`, `.is-dash` · анимации: `pa-draw`
- `src/labs/vkus/pathway.css`: `.pw-end`, `.is-hot`, `.pw-node`, `.pw-info`, `.pw-chip`, `.pw-lane`, `.pw-edge`, `.pw-ah`, `.pw-enz`, `.pw-tag`, `.is-sel`, `.pw-pick`
- `src/labs/vkus/trichome.css`: `.tr-info`, `.tr-controls`, `.mic-*`, `.tr-pel`, `.lab-*`, `.tr-svg`, `.tr-grid`, `.tr-top`, `.tr-sto`, `.tr-wrap`, `.tr-chart`, `.is-burst`

## События

Свои события страницы (`document`): кто шлёт и кто слушает.

- `basil:calm` — шлёт: `src/js/scene/01-budget.js:32`; слушают: —
- `basil:garden` — шлёт: `src/js/app/22-garden.js:13`; слушают: `src/js/app/22-garden-view.js:312`, `src/js/app/22-garden-view.js:329`, `src/js/app/22-install.js:24`
- `basil:panel` — шлёт: `src/js/app/02-router.js:73`; слушают: `src/js/app/22-reading-pos.js:253`, `src/js/science/06-labs-loader.js:185`
- `basil:ready` — шлёт: `src/js/app/23-boot.js:20`; слушают: `src/js/app/03-peek.js:240`, `src/js/app/22-garden-view.js:327`, `src/js/haptics.js:91`, `src/js/science/06-labs-loader.js:176`, `src/js/science/06-labs-loader.js:214`, `src/js/science/07-deep.js:224`
- `basil:search-ready` — шлёт: `src/js/app/04-search.js:130`; слушают: `src/js/app/04-search.js:426`
- `basil:theme` — шлёт: `src/js/app/01-theme.js:18`; слушают: `src/js/app/03-peek.js:205`, `src/js/app/05-scene.js:156`, `src/js/scene/04-background.js:487`, `src/js/scene/06-plant-bitmaps.js:88`, `src/js/science/05-molecules.js:302`, `src/labs/urozhay/pesto.js:67`
- `basil:view` — шлёт: `src/js/app/02-router.js:170`; слушают: `src/js/app/02-router.js:249`, `src/js/app/02-router.js:279`, `src/js/app/03-sheets.js:184`, `src/js/science/07-deep.js:226`
- `basil:weather` — шлёт: `src/js/app/22-garden-weather.js:56`, `src/js/app/22-garden-weather.js:78`; слушают: `src/js/app/22-garden-view.js:313`, `src/js/app/22-garden-view.js:325`

## Хранилище

Ключи `localStorage` (и база IndexedDB `basil-photos`) — в каких файлах встречаются, с первой строкой.

- `basil-deep` — `src/js/science/07-deep.js:16`
- `basil-depth` — `src/js/science/07-deep.js:5`
- `basil-detour` — `src/js/app/22-reading-pos.js:330`
- `basil-found` — `src/js/app/04-search.js:285`
- `basil-garden` — `src/js/app/22-garden.js:6`
- `basil-haptics` — `src/js/haptics.js:7`
- `basil-install` — `src/js/app/22-install.js:67`
- `basil-last` — `src/js/app/02-router.js:93`
- `basil-photos` — `src/js/app/22-garden-photos.js:5`
- `basil-pos` — `src/js/app/22-reading-pos.js:8`
- `basil-recent` — `src/js/app/04-search.js:322`
- `basil-theme` — `src/js/app/01-theme.js:8`
- `basil-weather` — `src/js/app/22-garden-weather.js:7`

## Ширины экрана

Сколько правил `@media` на каждую ширину и в каких файлах. Новую ширину не придумывайте — берите ближайшую.

- `max-width: 900px` — 12: 01-hero.css, 06-blocks.css, 07-vkus.css ×2, 08-home.css ×5, 13-calendar.css, 15-nav-helpers.css, 16-pinching.css
- `max-width: 560px` — 11: 04-controls.css, 07-vkus.css, 08-home.css ×3, 10-varieties.css, 14-care.css, 15-fertilizers.css, 24-toc.css, aphid.css, trichome.css
- `max-width: 640px` — 9: 05-deep.css, 06-blocks.css ×2, 13-calendar.css, 13-recipes.css, 14-care.css, 16-pinching.css ×2, molecules.css
- `max-width: 520px` — 7: 11-places.css, 15-fertilizers.css, 16-pinching.css, anthocyanin.css, chemotype.css ×2, heat.css
- `max-width: 480px` — 6: 09-chapter-chrome.css, 10-varieties.css, 12-steps.css ×2, 18-problems.css, 23-garden.css
- `max-width: 860px` — 6: 05-deep.css, 08-home-science.css, 11-places.css, 15-fertilizers.css ×2, chemotype.css
- `max-width: 700px` — 5: 04-deep-index.css, 08-home.css, 09-chapter-chrome.css, 10-varieties.css, 11-places.css
- `max-width: 420px` — 4: 04-controls.css, 10-depth.css, 15-fertilizers.css ×2
- `max-width: 720px` — 3: 08-home.css ×2, 17-harvest.css
- `max-width: 760px` — 3: 06-lab-tools.css, 12-steps.css, flows.css
- `max-width: 820px` — 3: 14-care.css, 15-fertilizers.css ×2
- `max-width: 899px` — 3: 03-header.css, 24-toc.css ×2
- `min-width: 900px` — 3: 11-deep-footer.css, 24-toc.css, pairing.css
- `max-width: 940px` — 3: 15-fertilizers.css, 18-problems.css ×2
- `max-width: 1279px` — 3: 21-sheets.css ×3
- `max-width: 460px` — 2: 10-varieties.css, oxide.css
- `min-width: 941px` — 2: 18-problems.css ×2
- `min-width: 1280px` — 2: 21-sheets.css ×2
- `min-width: 481px` — 1: 12-steps.css
- `min-width: 561px` — 1: 23-garden.css
- `max-width: 800px` — 1: molecules.css
- `max-width: 1060px` — 1: 08-home.css
- `max-width: 1099px` — 1: 03-header.css
- `min-width: 1100px` — 1: 24-toc.css

## Заполнители сборки

`{{…}}` в каркасе и в работнике без сети — где их подставляет `scripts/build.py`.

- `{{title}}` в `src/layout.html` — `build.py:1162`
- `{{description}}` в `src/layout.html` — `build.py:1162`
- `{{pwa}}` в `src/layout.html` — `build.py:1178`
- `{{fonts}}` в `src/layout.html` — `build.py:1177`
- `{{tocbtn}}` в `src/layout.html` — `build.py:1159`
- `{{content}}` в `src/layout.html` — `build.py:1157`
- `{{toc}}` в `src/layout.html` — `build.py:1159`
- `{{scripts}}` в `src/layout.html` — `build.py:1176`
- `{{version}}` в `src/sw.js` — `build.py:1261`
- `{{precache}}` в `src/sw.js` — `build.py:1261`

## Проверки

Что проверяет каждый набор `tests/*.js` (первая строка его шапки) и на чём: `сервер` — копия для хостинга `dist/site` через `scripts/serve.py`, `корень` — сборка в корне с диска. Все разом — `sh tests/run.sh`.

- `tests/agronom.js` — «Карманный агроном»: погода для кустов (ответы Open-Meteo подменены заготовками, сеть не нужна). · корень · все страницы
- `tests/clean.js` — Версия для хостинга (dist/site) на локальном сервере с правилами .htaccess: · сервер
- `tests/controls.js` — Каждая кнопка на каждой вкладке каждой страницы — на телефоне и компьютере, с раскрытыми «Глубже»: · корень · все страницы
- `tests/gallery.js` — Every illustration of a chapter on one sheet, to look at them together: the pictures the page shows · корень · index.html
- `tests/garden.js` — «Мой базилик» на телефоне и компьютере: пустой блок, куст через форму, дела на неделю, «Сделано», · корень · index.html, sorta.html, moy.html
- `tests/gestures.js` — Жесты: молекула крутится пальцем в любую сторону, страница под ней стоит; мимо молекулы страница листается. · корень · index.html, vkus.html, urozhay.html, udobreniya.html, kalendar.html, formirovka.html
- `tests/ills.js` — Картинки (data-ill) на каждой вкладке каждой страницы. · сервер + корень · все страницы
- `tests/labs.js` — Каждая модель на своей странице: запускается без ошибок, ничего не вылезает за край, · корень · все страницы
- `tests/nav.js` — Навигация на телефоне и компьютере: страница открывается сверху (и страница из памяти для «Назад» тоже, одним · сервер
- `tests/overlap.js` — Текст не лезет на картинку — на каждой вкладке каждой страницы, на телефоне и на компьютере. · корень · все страницы
- `tests/pages.js` — Сборка в корне репозитория (ссылки вида sorta.html), открытая как файлы: · корень · все страницы
- `tests/peek.js` — «Заглянуть»: ссылка из текста в другую главу или на другую вкладку, кнопка строки «Глубже» в шапке главы и инструмент · сервер + корень · все страницы
- `tests/perf.js` — Скорость на телефоне с процессором, замедленным в 4 раза: каждая страница. · корень · все страницы
- `tests/pwa.js` — Гид на экране телефона и без сети — на копии сборки для хостинга (dist/site), через scripts/serve.py. · сервер · sorta.html, index.html
- `tests/single.js` — Книга одним файлом (python3 scripts/build.py --single …): все главы на одной странице, переходы по #id, · — · single.html
