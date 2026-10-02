# Карта проекта

Файл собирает `scripts/build.py` при каждой сборке — не правьте руками. Как работать с проектом — в `CLAUDE.md`.

## Главы и вкладки

### Главная — `/` (`index.html`)
- `src/pages/glavnaya.html` · вся глава · 180 стр.

### Сорта — `/сорта` (`sorta.html`)
- `src/pages/sorta/_head.html` · обложка, вкладки · 14 стр.
- `src/pages/sorta/1-katalog.html` · #каталог — Каталог сортов · 112 стр.<br>глубже: Химотипы `#deep-himotipy`, Антоцианы `#deep-antociany`
- `src/pages/sorta/2-podbor.html` · #подбор — Подбор сорта · 54 стр.<br>глубже: Генотип × среда `#deep-fenotip`
- `src/pages/sorta/3-vybor.html` · #выбор — Как выбрать семена · 88 стр.<br>глубже: Устойчивость `#deep-ustoychivost`
- `src/pages/sorta/_foot.html` · подвал главы · 3 стр.

### Посадка — `/посадка` (`posadka.html`)
- `src/pages/posadka/_head.html` · обложка, вкладки · 14 стр.
- `src/pages/posadka/1-mesto.html` · #место — Где растить · 83 стр.<br>модели: `window`; глубже: Солнце в окне `#deep-okno`
- `src/pages/posadka/2-posev.html` · #посев — Посев и рассада · 98 стр.<br>модели: `germ`; глубже: Прорастание `#deep-prorastanie`
- `src/pages/posadka/3-magazin.html` · #магазин — Базилик из магазина · 78 стр.<br>модели: `shade`; глубже: Теснота и тень `#deep-ten`
- `src/pages/posadka/4-gorshok.html` · #горшок — Горшок и грунт · 104 стр.<br>модели: `perched`; глубже: Подвешенная вода `#deep-voda-v-gorshke`
- `src/pages/posadka/_foot.html` · подвал главы · 3 стр.

### Календарь — `/календарь` (`kalendar.html`)
- `src/pages/kalendar.html` · вся глава · 173 стр.<br>модели: `daylen`, `gdd`; глубже: Длина дня `#deep-fotoperiod`, Холод и лёд `#deep-zamorozok`, Градусо-дни `#deep-gradusodni`

### Уход — `/уход` (`uhod.html`)
- `src/pages/uhod/_head.html` · обложка, вкладки · 14 стр.
- `src/pages/uhod/1-svet.html` · #свет — Свет · 132 стр.<br>модели: `spectrum`, `lamp`; глубже: Фотосинтез `#deep-fotosintez`, Обратные квадраты `#deep-lampa`
- `src/pages/uhod/2-poliv.html` · #полив — Полив · 101 стр.<br>модели: `vpd`; глубже: Путь воды и VPD `#deep-vpd`
- `src/pages/uhod/3-teplo.html` · #тепло — Тепло и воздух · 88 стр.<br>модели: `temp`; глубже: Ферменты и жара `#deep-fermenty`
- `src/pages/uhod/4-pochva.html` · #почва — Почва и pH · 79 стр.<br>модели: `ph`; глубже: pH и доступность `#deep-ph`
- `src/pages/uhod/5-sezony.html` · #сезоны — Уход по сезонам · 53 стр.<br>модели: `solar`; глубже: Зимний свет `#deep-zima`
- `src/pages/uhod/_foot.html` · подвал главы · 3 стр.

### Удобрения — `/удобрения` (`udobreniya.html`)
- `src/pages/udobreniya/_head.html` · обложка, вкладки · 14 стр.
- `src/pages/udobreniya/1-osnovy.html` · #основы — Правила подкормки · 79 стр.<br>модели: `osmos`; глубже: Осмос `#deep-osmos`
- `src/pages/udobreniya/2-elementy.html` · #элементы — Что за что отвечает · 76 стр.<br>модели: `flows`; глубже: Ксилема и флоэма `#deep-mobilnost`
- `src/pages/udobreniya/3-stadii.html` · #стадии — Питание по стадиям роста · 77 стр.<br>модели: `barrel`; глубже: Закон минимума `#deep-libih`
- `src/pages/udobreniya/4-plan.html` · #план — План подкормок · 56 стр.<br>модели: `ncycle`; глубже: Круговорот азота `#deep-azot`
- `src/pages/udobreniya/5-sredstva.html` · #средства — Какие удобрения использовать · 89 стр.<br>модели: `oxide`; глубже: Оксиды на упаковке `#deep-oksidy`
- `src/pages/udobreniya/6-kalkulyator.html` · #калькулятор — Калькулятор раствора · 86 стр.<br>модели: `ec`; глубже: EC и ppm `#deep-ec`
- `src/pages/udobreniya/7-gidro.html` · #гидропоника — Гидропоника: EC и pH · 85 стр.<br>модели: `o2`; глубже: Кислород и хелаты `#deep-kislorod`
- `src/pages/udobreniya/8-mify.html` · #мифы — Мифы о подкормках · 50 стр.<br>глубже: Химия мифов `#deep-mify-himiya`
- `src/pages/udobreniya/_foot.html` · подвал главы · 3 стр.

### Прищипывание — `/прищипывание` (`formirovka.html`)
- `src/pages/formirovka/_head.html` · обложка, вкладки · 14 стр.
- `src/pages/formirovka/1-osnovy.html` · #основы — Как прищипывать · 101 стр.<br>модели: `auxin`; глубже: Апикальное доминирование `#deep-auksin`
- `src/pages/formirovka/2-trenazher.html` · #тренажер — Тренажёр прищипывания · 61 стр.<br>модели: `branch`; глубже: Геометрия куста `#deep-2n`
- `src/pages/formirovka/3-cvetenie.html` · #цветение — Цветение и омоложение · 70 стр.<br>глубже: Флориген `#deep-florigen`
- `src/pages/formirovka/_foot.html` · подвал главы · 3 стр.

### Урожай — `/урожай` (`urozhay.html`)
- `src/pages/urozhay/_head.html` · обложка, вкладки · 14 стр.
- `src/pages/urozhay/1-sbor.html` · #сбор — Правила сбора · 73 стр.<br>модели: `diurnal`; глубже: Суточный ритм аромата `#deep-sutki`
- `src/pages/urozhay/2-hranenie.html` · #хранение — Хранение и заготовки · 58 стр.<br>модели: `storage`; глубже: Холод и потемнение `#deep-holod`
- `src/pages/urozhay/3-recepty.html` · #рецепты — Рецепты · 47 стр.<br>модели: `pesto`; глубже: Химия песто `#deep-pesto`
- `src/pages/urozhay/_foot.html` · подвал главы · 3 стр.

### Вкус и аромат — `/вкус` (`vkus.html`)
- `src/pages/vkus/_head.html` · обложка, вкладки · 14 стр.
- `src/pages/vkus/1-aromat.html` · #аромат — Откуда аромат · 77 стр.<br>модели: `trichome`, `pathway`; глубже: Запах разреза `#deep-geksenal`
- `src/pages/vkus/2-molekuly.html` · #молекулы — Молекулы аромата · 43 стр.<br>модели: `molecules`; глубже: Как работает нос `#deep-nos`
- `src/pages/vkus/3-himotipy.html` · #химотипы — Сорта и химия · 47 стр.<br>модели: `chemotype`; глубже: Химотип и среда `#deep-himotip-sreda`
- `src/pages/vkus/4-kuhnya.html` · #кухня — Физика кухни · 63 стр.<br>модели: `heat`, `anthocyanin`; глубже: Летучесть `#deep-letuchest`
- `src/pages/vkus/5-sochetaniya.html` · #сочетания — Сочетания · 50 стр.<br>модели: `pairing`; глубже: Гипотеза пищевых пар `#deep-pary`
- `src/pages/vkus/_foot.html` · подвал главы · 3 стр.

### Размножение — `/размножение` (`razmnozhenie.html`)
- `src/pages/razmnozhenie/_head.html` · обложка, вкладки · 14 стр.
- `src/pages/razmnozhenie/1-cherenki.html` · #черенки — Черенкование · 71 стр.<br>модели: `roots`; глубже: Придаточные корни `#deep-korni`
- `src/pages/razmnozhenie/2-semena.html` · #семена — Свои семена · 100 стр.<br>модели: `seedlife`; глубже: Генетика семян `#deep-genetika`, Старение семян `#deep-starenie-semyan`
- `src/pages/razmnozhenie/_foot.html` · подвал главы · 3 стр.

### Проблемы — `/проблемы` (`problemy.html`)
- `src/pages/problemy/_head.html` · обложка, вкладки · 14 стр.
- `src/pages/problemy/1-diagnostika.html` · #диагностика — Диагностика по симптомам · 53 стр.<br>модели: `pigment`; глубже: Язык цвета `#deep-pigmenty`
- `src/pages/problemy/2-bolezni.html` · #болезни — Болезни · 49 стр.<br>модели: `dm`; глубже: Ложная мучнистая роса `#deep-oomicet`
- `src/pages/problemy/3-vrediteli.html` · #вредители — Вредители · 47 стр.<br>модели: `aphid`; глубже: Экспонента тли `#deep-tlya`
- `src/pages/problemy/4-profilaktika.html` · #профилактика — Профилактика и средства · 65 стр.<br>глубже: Химическая оборона `#deep-oborona`
- `src/pages/problemy/_foot.html` · подвал главы · 3 стр.

### Справка — `/справка` (`spravka.html`)
- `src/pages/spravka/_head.html` · обложка, вкладки · 14 стр.
- `src/pages/spravka/1-voprosy.html` · #вопросы — Частые вопросы · 69 стр.<br>глубже: Базилик в цифрах `#deep-cifry`
- `src/pages/spravka/2-slovar.html` · #словарь — Словарь · 5 стр.
- `src/pages/spravka/3-chek-list.html` · #чек-лист — Чек-лист сезона · 11 стр.
- `src/pages/spravka/_foot.html` · подвал главы · 3 стр.

### Мой базилик — `/мой-базилик` (`moy.html`)
- `src/pages/moy/_head.html` · обложка, вкладки · 14 стр.
- `src/pages/moy/1-kusty.html` · #кусты — Кусты · 8 стр.
- `src/pages/moy/_foot.html` · подвал главы · 3 стр.

## Модели (src/labs/)

| модель | глава | заголовок | файлы |
|---|---|---|---|
| `window` | Посадка | Солнце в полдень | `src/labs/posadka/window.js` · `src/labs/posadka/window.css` |
| `germ` | Посадка | Сколько ждать всходов | `src/labs/posadka/germ.js` · `src/labs/posadka/germ.css` |
| `shade` | Посадка | Тень соседей | `src/labs/posadka/shade.js` · `src/labs/posadka/shade.css` |
| `perched` | Посадка | Где стоит вода в горшке | `src/labs/posadka/perched.js` · `src/labs/posadka/perched.css` |
| `daylen` | Календарь | Длина дня за год | `src/labs/kalendar/daylen.js` |
| `gdd` | Календарь | Сколько ждать урожая | `src/labs/kalendar/gdd.js` · `src/labs/kalendar/gdd.css` |
| `spectrum` | Уход | Что поглощает лист | `src/labs/uhod/spectrum.js` |
| `lamp` | Уход | Лампа и расстояние | `src/labs/uhod/lamp.js` |
| `vpd` | Уход | VPD: воздух глазами листа | `src/labs/uhod/vpd.js` · `src/labs/uhod/vpd.css` |
| `temp` | Уход | Фотосинтез, дыхание и прирост | `src/labs/uhod/temp.js` |
| `ph` | Уход | Доступность элементов по pH | `src/labs/uhod/ph.js` · `src/labs/uhod/ph.css` |
| `solar` | Уход | Солнечная энергия по месяцам | `src/labs/uhod/solar.js` |
| `osmos` | Удобрения | Клетка корня и почвенный раствор | `src/labs/udobreniya/osmos.js` · `src/labs/udobreniya/osmos.css` |
| `flows` | Удобрения | Два потока и хлорофилл | `src/labs/udobreniya/flows.js` · `src/labs/udobreniya/flows.css` |
| `barrel` | Удобрения | Бочка Либиха | `src/labs/udobreniya/barrel.js` · `src/labs/udobreniya/barrel.css` |
| `ncycle` | Удобрения | Круговорот азота | `src/labs/udobreniya/ncycle.js` · `src/labs/udobreniya/ncycle.css` |
| `oxide` | Удобрения | Пересчёт оксидов в элементы | `src/labs/udobreniya/oxide.js` · `src/labs/udobreniya/oxide.css` |
| `ec` | Удобрения | EC, ppm и осмос | `src/labs/udobreniya/ec.js` · `src/labs/udobreniya/ec.css` |
| `o2` | Удобрения | Кислород против дыхания корней | `src/labs/udobreniya/o2.js` |
| `auxin` | Прищипывание | Что происходит после среза | `src/labs/formirovka/auxin.js` · `src/labs/formirovka/auxin.css` |
| `branch` | Прищипывание | Куст после n прищипываний | `src/labs/formirovka/branch.js` |
| `diurnal` | Урожай | Летний день глазами листа | `src/labs/urozhay/diurnal.js` |
| `storage` | Урожай | Сколько живёт срезанный базилик | `src/labs/urozhay/storage.js` |
| `pesto` | Урожай | Песто-лаборатория | `src/labs/urozhay/pesto.js` · `src/labs/urozhay/pesto.css` |
| `trichome` | Вкус и аромат | Лист под микроскопом | `src/labs/vkus/trichome.js` · `src/labs/vkus/trichome.css` |
| `pathway` | Вкус и аромат | Два конвейера аромата | `src/labs/vkus/pathway.js` · `src/labs/vkus/pathway.css` |
| `molecules` | Вкус и аромат |  | `src/labs/vkus/molecules.js` · `src/labs/vkus/molecules.css` |
| `chemotype` | Вкус и аромат | Химический отпечаток сорта | `src/labs/vkus/chemotype.js` · `src/labs/vkus/chemotype.css` |
| `heat` | Вкус и аромат | Когда класть базилик | `src/labs/vkus/heat.js` · `src/labs/vkus/heat.css` |
| `anthocyanin` | Вкус и аромат | Фиолетовый базилик и pH | `src/labs/vkus/anthocyanin.js` · `src/labs/vkus/anthocyanin.css` |
| `pairing` | Вкус и аромат | Лаборатория сочетаний | `src/labs/vkus/pairing.js` · `src/labs/vkus/pairing.css` |
| `roots` | Размножение | Черенок в стакане | `src/labs/razmnozhenie/roots.js` · `src/labs/razmnozhenie/roots.css` |
| `seedlife` | Размножение | Срок жизни семян | `src/labs/razmnozhenie/seedlife.js` · `src/labs/razmnozhenie/seedlife.css` |
| `pigment` | Проблемы | Смешайте пигменты | `src/labs/problemy/pigment.js` · `src/labs/problemy/pigment.css` |
| `dm` | Проблемы | Риск ложной мучнистой росы | `src/labs/problemy/dm.js` · `src/labs/problemy/dm.css` |
| `aphid` | Проблемы | Колония из одной тли | `src/labs/problemy/aphid.js` · `src/labs/problemy/aphid.css` |

Общие помощники моделей — `src/labs/_frame.js`; инструменты графиков, кнопок и ползунков (`h.chart`, `h.plot`, `h.rangeHtml` …) — `src/js/science/`.

## Библиотеки рисунков (src/labs/_lib/)

Модель или `_shared.js` главы подключает библиотеку строкой `/* @use micro, ills */`; сборка кладёт её в файл главы один раз.

- `src/labs/_lib/food.js` — food: small illustrations of what basil goes with
- `src/labs/_lib/ills.js` — ills: plants, symptoms and pests for the illustrated guides
- `src/labs/_lib/micro.js` — micro: drawing a leaf under the microscope
- `src/labs/_lib/props.js` — props: things for the step-by-step pictures

Иллюстрации на страницах — элементы `data-ill="художник:вариант"`; художники регистрируются через `illustrate()` в `src/labs/<глава>/_shared.js` и рисуются, когда элемент подходит к экрану. Все рисунки главы на одном листе: `node tests/gallery.js <глава>`.

- `src/labs/formirovka/_shared.js`: `pinch`
- `src/labs/posadka/_shared.js`: `sow`, `shop`, `place`
- `src/labs/problemy/_shared.js`: `sym`, `dis`, `pest`
- `src/labs/razmnozhenie/_shared.js`: `cut`, `seed`
- `src/labs/sorta/_shared.js`: `sort`, `vtype`
- `src/labs/udobreniya/_shared.js`: `def`
- `src/labs/uhod/_shared.js`: `water`
- `src/labs/urozhay/_shared.js`: `store`

## Скрипты (src/js/)

**app.js**
- `src/js/app/00-core.js` (125 стр.): MONTHS, MONTHS_NOM, MONTHS_SHORT, HAP, PAGES
- `src/js/app/01-theme.js` (29 стр.): initTheme
- `src/js/app/02-router.js` (276 стр.): ENTRY, initRouter, initPagers, initScrollChrome
- `src/js/app/03-sheets.js` (158 стр.): initSheets
- `src/js/app/04-search-words.js` (134 стр.): AS_IS, LAYOUT_EN, SYNONYMS
- `src/js/app/04-search.js` (428 стр.): SEARCH_GROUPS, SEARCH_SKIP, SEARCH_BOX, SEARCH_STOP, FOUND_KEY, RECENT_KEY, initSearch
- `src/js/app/05-scene.js` (161 стр.): initScene, initHoverLight, initOffscreenPause, initLeafField
- `src/js/app/06-mini-plants.js` (32 стр.)
- `src/js/app/07-home.js` (36 стр.): initHome
- `src/js/app/08-varieties.js` (250 стр.): EASY, initVarieties, initQuiz
- `src/js/app/09-places.js` (43 стр.): initPlaces
- `src/js/app/10-soil.js` (26 стр.): initSoil
- `src/js/app/11-calendar.js` (226 стр.): initCalendar
- `src/js/app/12-light.js` (39 стр.): initDli
- `src/js/app/13-nutrients-elements.js` (43 стр.): GROUP_NAME, MOB, initElements
- `src/js/app/14-nutrients-stages.js` (119 стр.): initStages
- `src/js/app/15-nutrients-plan.js` (87 стр.): initPlan
- `src/js/app/16-nutrients-npk.js` (49 стр.): initNpk
- `src/js/app/17-nutrients-dose.js` (52 стр.): FRACTIONS, initDose
- `src/js/app/18-pinching.js` (196 стр.): initSim
- `src/js/app/19-seeds.js` (21 стр.): initGerm
- `src/js/app/20-problems.js` (59 стр.): initDiagnostics
- `src/js/app/21-reference.js` (107 стр.): initGlossary, initChecklist, initRecipes
- `src/js/app/22-garden-view.js` (322 стр.): WEEKDAY, renderGardenBox, renderGardenHome, renderGardenForm, NOTE_NAMES, renderGardenPlant, renderGardenSheet, initGarden
- `src/js/app/22-garden.js` (128 стр.): GARDEN_KEY
- `src/js/app/22-reading-pos.js` (134 стр.): POS_KEY, initReadingPos, initLinks, initPageAction
- `src/js/app/23-boot.js` (21 стр.)

**science.js**
- `src/js/science/00-core.js` (20 стр.)
- `src/js/science/01-colors.js` (40 стр.)
- `src/js/science/02-controls.js` (30 стр.)
- `src/js/science/03-charts.js` (153 стр.)
- `src/js/science/04-astronomy.js` (22 стр.): CITIES
- `src/js/science/05-molecules.js` (270 стр.): FAM, MOLS, EXTRA, CHEMO, CHEMO_COLS, PAIRS, MolViewer
- `src/js/science/06-labs-loader.js` (221 стр.): SELF, draw, HIDDEN, drawDue
- `src/js/science/07-deep.js` (228 стр.): KIND, DEPTH_KEY, DEPTHS, EASE, ANIMATED, initDepthControl, initDeep, initHomeMolecule, init

**scene.js**
- `src/js/scene/00-core.js` (8 стр.): TAU
- `src/js/scene/01-budget.js` (84 стр.): CALM, CALM_FPS
- `src/js/scene/02-noise.js` (22 стр.)
- `src/js/scene/03-wind.js` (22 стр.)
- `src/js/scene/04-background.js` (499 стр.): SPR_L, initBackground
- `src/js/scene/05-plant.js` (49 стр.)
- `src/js/scene/06-plant-bitmaps.js` (382 стр.): LEAF_D, LEAF_BOX, LEAF_FILLS, Plant
- `src/js/scene/07-aroma.js` (41 стр.): NOTES

**data.js**
- `src/js/data/00-nav.js` (59 стр.): CHAPTERS, TOOLS, QUICK, MONTH_TIPS
- `src/js/data/01-varieties.js` (146 стр.): VARIETIES, VARIETY_TYPES, QUIZ
- `src/js/data/02-places.js` (71 стр.): PLACES, PRESETS, SOIL_RECIPES
- `src/js/data/03-nutrients.js` (127 стр.): ELEMENTS, STAGES, DOSE, NPK_PRESETS
- `src/js/data/04-problems.js` (112 стр.): P_LABEL, DIAG, DISEASES, PESTS, TREATMENTS
- `src/js/data/05-checklist.js` (30 стр.): CHECKLIST
- `src/js/data/06-recipes.js` (77 стр.): RECIPE_CATS, RECIPES
- `src/js/data/07-glossary.js` (49 стр.): GLOSSARY
- `src/js/data/08-garden.js` (78 стр.): GARDEN

## Стили (src/css/)

**style.css**: `00-tokens.css`, `01-base.css`, `02-ambient.css`, `03-header.css`, `04-controls.css`, `05-views.css`, `06-blocks.css`, `07-chapter-art.css`, `08-home.css`, `09-chapter-chrome.css`, `10-varieties.css`, `11-places.css`, `12-steps.css`, `13-calendar.css`, `14-care.css`, `15-fertilizers.css`, `16-pinching.css`, `17-harvest.css`, `18-problems.css`, `19-reference.css`, `20-footer.css`, `21-sheets.css`, `22-selection.css`, `23-garden.css`
**lab.css**: `00-aroma.css`, `00-ill.css`, `00-micro.css`, `00-tokens.css`, `01-hero.css`, `02-header.css`, `03-deep-switch.css`, `04-deep-index.css`, `05-deep.css`, `06-lab-tools.css`, `07-vkus.css`, `08-home-science.css`, `09-hover-light.css`, `10-depth.css`, `11-deep-footer.css`, `12-sci-notes.css`, `13-recipes.css`, `14-paint.css`, `15-nav-helpers.css`

