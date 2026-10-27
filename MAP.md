# Карта проекта

Файл собирает `scripts/build.py` при каждой сборке — не правьте руками. Как работать с проектом — в `CLAUDE.md`.

## Главы и вкладки

### Главная — `/` (`index.html`)
- `src/pages/glavnaya.html` · вся глава · 179 стр.

### Сорта — `/сорта` (`sorta.html`)
- `src/pages/sorta/_head.html` · обложка, вкладки · 14 стр.
- `src/pages/sorta/1-katalog.html` · #каталог — Каталог сортов · 107 стр.<br>развороты: Химотипы `#deep-himotipy`, Антоцианы `#deep-antociany`
- `src/pages/sorta/2-podbor.html` · #подбор — Подбор сорта · 52 стр.<br>развороты: Генотип × среда `#deep-fenotip`
- `src/pages/sorta/3-vybor.html` · #выбор — Как выбрать семена · 85 стр.<br>развороты: Устойчивость `#deep-ustoychivost`
- `src/pages/sorta/4-semena.html` · #семена — Свои семена · 95 стр.<br>модели: `seedlife`; развороты: Генетика семян `#deep-genetika`, Старение семян `#deep-starenie-semyan`
- `src/pages/sorta/_foot.html` · подвал главы · 3 стр.

### Посадка — `/посадка` (`posadka.html`)
- `src/pages/posadka/_head.html` · обложка, вкладки · 14 стр.
- `src/pages/posadka/1-mesto.html` · #место — Где растить · 75 стр.<br>модели: `window`; развороты: Солнце в окне `#deep-okno`
- `src/pages/posadka/2-sroki.html` · #сроки — Сроки посадки · 152 стр.<br>модели: `daylen`, `gdd`; развороты: Длина дня `#deep-fotoperiod`, Холод и лёд `#deep-zamorozok`, Градусо-дни `#deep-gradusodni`
- `src/pages/posadka/3-posev.html` · #посев — Посев и рассада · 89 стр.<br>модели: `germ`; развороты: Прорастание `#deep-prorastanie`
- `src/pages/posadka/4-magazin.html` · #магазин — Базилик из магазина · 72 стр.<br>модели: `shade`; развороты: Теснота и тень `#deep-ten`
- `src/pages/posadka/5-gorshok.html` · #горшок — Горшок и грунт · 99 стр.<br>модели: `perched`; развороты: Подвешенная вода `#deep-voda-v-gorshke`
- `src/pages/posadka/6-cherenki.html` · #черенки — Черенкование · 66 стр.<br>модели: `roots`; развороты: Придаточные корни `#deep-korni`
- `src/pages/posadka/_foot.html` · подвал главы · 3 стр.

### Уход — `/уход` (`uhod.html`)
- `src/pages/uhod/_head.html` · обложка, вкладки · 14 стр.
- `src/pages/uhod/1-svet.html` · #свет — Свет · 122 стр.<br>модели: `spectrum`, `lamp`; развороты: Фотосинтез `#deep-fotosintez`, Обратные квадраты `#deep-lampa`
- `src/pages/uhod/2-poliv.html` · #полив — Полив · 95 стр.<br>модели: `vpd`; развороты: Путь воды и VPD `#deep-vpd`
- `src/pages/uhod/3-teplo.html` · #тепло — Тепло и воздух · 86 стр.<br>модели: `temp`; развороты: Ферменты и жара `#deep-fermenty`
- `src/pages/uhod/4-pochva.html` · #почва — Почва и pH · 76 стр.<br>модели: `ph`; развороты: pH и доступность `#deep-ph`
- `src/pages/uhod/5-sezony.html` · #сезоны — Уход по сезонам · 47 стр.<br>модели: `solar`; развороты: Зимний свет `#deep-zima`
- `src/pages/uhod/_foot.html` · подвал главы · 3 стр.

### Удобрения — `/удобрения` (`udobreniya.html`)
- `src/pages/udobreniya/_head.html` · обложка, вкладки · 14 стр.
- `src/pages/udobreniya/1-osnovy.html` · #основы — Правила подкормки · 124 стр.<br>модели: `osmos`; развороты: Осмос `#deep-osmos`, Химия мифов `#deep-mify-himiya`
- `src/pages/udobreniya/2-elementy.html` · #элементы — Что за что отвечает · 70 стр.<br>модели: `flows`; развороты: Ксилема и флоэма `#deep-mobilnost`
- `src/pages/udobreniya/3-stadii.html` · #стадии — Питание по стадиям роста · 122 стр.<br>модели: `barrel`, `ncycle`; развороты: Закон минимума `#deep-libih`, Круговорот азота `#deep-azot`
- `src/pages/udobreniya/4-sredstva.html` · #средства — Какие удобрения использовать · 85 стр.<br>модели: `oxide`; развороты: Оксиды на упаковке `#deep-oksidy`
- `src/pages/udobreniya/5-kalkulyator.html` · #калькулятор — Калькулятор раствора · 89 стр.<br>модели: `ec`; развороты: EC и ppm `#deep-ec`
- `src/pages/udobreniya/_foot.html` · подвал главы · 3 стр.

### Гидропоника — `/гидропоника` (`gidro.html`)
- `src/pages/gidro/_head.html` · обложка, вкладки · 13 стр.
- `src/pages/gidro/1-osnovy.html` · #основы — Гидропоника: введение · 201 стр.<br>модели: `hsys`, `o2box`, `alloc`; развороты: Дыхание корня `#deep-dyhanie-kornya`, Почему быстрее `#deep-bystree`, История `#deep-istoriya-gidroponiki`
- `src/pages/gidro/2-sborka.html` · #сборка — Система своими руками · 191 стр.<br>модели: `kratky`, `capil`; развороты: Капилляры `#deep-kapillyary`, Пузыри `#deep-puzyri`
- `src/pages/gidro/3-rastvor.html` · #раствор — Раствор: EC, pH и кислород · 172 стр.<br>модели: `hmix`, `o2`, `drift`; развороты: Кислород и хелаты `#deep-kislorod`, Дрейф pH и EC `#deep-dreyf-ph`, Концентраты `#deep-osadok`
- `src/pages/gidro/4-proverki.html` · #проверки — Проверки и неполадки · 159 стр.<br>модели: `hcheck`, `pyth`; развороты: Питиум `#deep-pitium`, Водоросли `#deep-vodorosli`, Приборы `#deep-pribory`
- `src/pages/gidro/5-sravnenie.html` · #сравнение — Горшок или гидропоника · 143 стр.<br>развороты: Вкус `#deep-vkus-gidro`, Вода `#deep-voda-gidro`
- `src/pages/gidro/_foot.html` · подвал главы · 3 стр.

### Прищипка и сбор — `/прищипывание` (`formirovka.html`)
- `src/pages/formirovka/_head.html` · обложка, вкладки · 14 стр.
- `src/pages/formirovka/1-osnovy.html` · #основы — Как прищипывать · 95 стр.<br>модели: `auxin`; развороты: Апикальное доминирование `#deep-auksin`
- `src/pages/formirovka/2-trenazher.html` · #тренажер — Тренажёр прищипывания · 61 стр.<br>модели: `branch`; развороты: Геометрия куста `#deep-2n`
- `src/pages/formirovka/3-sbor.html` · #сбор — Сбор урожая · 68 стр.<br>модели: `diurnal`; развороты: Суточный ритм аромата `#deep-sutki`
- `src/pages/formirovka/4-cvetenie.html` · #цветение — Цветение и омоложение · 64 стр.<br>развороты: Флориген `#deep-florigen`
- `src/pages/formirovka/_foot.html` · подвал главы · 3 стр.

### Вкус и кухня — `/вкус` (`vkus.html`)
- `src/pages/vkus/_head.html` · обложка, вкладки · 14 стр.
- `src/pages/vkus/1-aromat.html` · #аромат — Откуда аромат · 117 стр.<br>модели: `trichome`, `pathway`, `chemotype`; развороты: Запах разреза `#deep-geksenal`, Химотип и среда `#deep-himotip-sreda`
- `src/pages/vkus/2-molekuly.html` · #молекулы — Молекулы аромата · 43 стр.<br>модели: `molecules`; развороты: Как работает нос `#deep-nos`
- `src/pages/vkus/3-kuhnya.html` · #кухня — Физика кухни · 63 стр.<br>модели: `heat`, `anthocyanin`; развороты: Летучесть `#deep-letuchest`
- `src/pages/vkus/4-sochetaniya.html` · #сочетания — Сочетания · 50 стр.<br>модели: `pairing`; развороты: Гипотеза пищевых пар `#deep-pary`
- `src/pages/vkus/5-hranenie.html` · #хранение — Хранение и заготовки · 54 стр.<br>модели: `storage`; развороты: Холод и потемнение `#deep-holod`
- `src/pages/vkus/6-recepty.html` · #рецепты — Рецепты · 47 стр.<br>модели: `pesto`; развороты: Химия песто `#deep-pesto`
- `src/pages/vkus/_foot.html` · подвал главы · 3 стр.

### Проблемы — `/проблемы` (`problemy.html`)
- `src/pages/problemy/_head.html` · обложка, вкладки · 14 стр.
- `src/pages/problemy/1-diagnostika.html` · #диагностика — Диагностика по симптомам · 48 стр.<br>модели: `pigment`; развороты: Язык цвета `#deep-pigmenty`
- `src/pages/problemy/2-bolezni.html` · #болезни — Болезни · 44 стр.<br>модели: `dm`; развороты: Ложная мучнистая роса `#deep-oomicet`
- `src/pages/problemy/3-vrediteli.html` · #вредители — Вредители · 42 стр.<br>модели: `aphid`; развороты: Экспонента тли `#deep-tlya`
- `src/pages/problemy/4-profilaktika.html` · #профилактика — Профилактика и средства · 66 стр.<br>развороты: Химическая оборона `#deep-oborona`
- `src/pages/problemy/_foot.html` · подвал главы · 3 стр.

### Справка — `/справка` (`spravka.html`)
- `src/pages/spravka/_head.html` · обложка, вкладки · 14 стр.
- `src/pages/spravka/1-voprosy.html` · #вопросы — Частые вопросы · 76 стр.<br>развороты: Базилик в цифрах `#deep-cifry`
- `src/pages/spravka/2-slovar.html` · #словарь — Словарь · 5 стр.
- `src/pages/spravka/3-chek-list.html` · #чек-лист — Чек-лист сезона · 11 стр.
- `src/pages/spravka/4-lyubopytno.html` · #любопытно — Для любопытных · 4 стр.
- `src/pages/spravka/_foot.html` · подвал главы · 3 стр.

### Мой базилик — `/мой-базилик` (`moy.html`)
- `src/pages/moy/_head.html` · обложка, вкладки · 14 стр.
- `src/pages/moy/1-kusty.html` · #кусты — Кусты · 10 стр.
- `src/pages/moy/2-pogoda.html` · #погода — Погода · 11 стр.<br>модели: `weather`
- `src/pages/moy/3-opyty.html` · #опыты — Опыты · 121 стр.<br>модели: `exlitmus`, `exosmos`, `exgerm`, `exsweat`, `exlight`, `exapex`, `exroots`, `exdark`
- `src/pages/moy/_foot.html` · подвал главы · 3 стр.

## Модели (src/labs/)

| модель | глава | заголовок | файлы |
|---|---|---|---|
| `seedlife` | Сорта | Срок жизни семян | `src/labs/sorta/seedlife.js` · `src/labs/sorta/seedlife.css` |
| `window` | Посадка | Солнце в полдень | `src/labs/posadka/window.js` · `src/labs/posadka/window.css` |
| `daylen` | Посадка | Длина дня за год | `src/labs/posadka/daylen.js` |
| `gdd` | Посадка | Сколько ждать урожая | `src/labs/posadka/gdd.js` · `src/labs/posadka/gdd.css` |
| `germ` | Посадка | Сколько ждать всходов | `src/labs/posadka/germ.js` · `src/labs/posadka/germ.css` |
| `shade` | Посадка | Тень соседей | `src/labs/posadka/shade.js` · `src/labs/posadka/shade.css` |
| `perched` | Посадка | Где стоит вода в горшке | `src/labs/posadka/perched.js` · `src/labs/posadka/perched.css` |
| `roots` | Посадка | Черенок в стакане | `src/labs/posadka/roots.js` · `src/labs/posadka/roots.css` |
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
| `hsys` | Гидропоника | Шесть систем в разрезе | `src/labs/gidro/hsys.js` |
| `o2box` | Гидропоника | Если выключить компрессор | `src/labs/gidro/o2box.js` |
| `alloc` | Гидропоника | Корни, листья и свет | `src/labs/gidro/alloc.js` · `src/labs/gidro/alloc.css` |
| `kratky` | Гидропоника | Хватит ли банки | `src/labs/gidro/kratky.js` · `src/labs/gidro/kratky.css` |
| `capil` | Гидропоника | Докуда поднимется вода | `src/labs/gidro/capil.js` · `src/labs/gidro/capil.css` |
| `hmix` | Гидропоника | Раствор для гидропоники | `src/labs/gidro/hmix.js` · `src/labs/gidro/hmix.css` |
| `o2` | Гидропоника | Кислород против дыхания корней | `src/labs/gidro/o2.js` · `src/labs/gidro/o2.css` |
| `drift` | Гидропоника | Куда уплывёт раствор | `src/labs/gidro/drift.js` · `src/labs/gidro/drift.css` |
| `hcheck` | Гидропоника | Проверка за две минуты | `src/labs/gidro/hcheck.js` · `src/labs/gidro/hcheck.css` |
| `pyth` | Гидропоника | Споры у корня | `src/labs/gidro/pyth.js` |
| `auxin` | Прищипка и сбор | Что происходит после среза | `src/labs/formirovka/auxin.js` · `src/labs/formirovka/auxin.css` |
| `branch` | Прищипка и сбор | Куст после n прищипываний | `src/labs/formirovka/branch.js` |
| `diurnal` | Прищипка и сбор | Летний день глазами листа | `src/labs/formirovka/diurnal.js` |
| `trichome` | Вкус и кухня | Лист под микроскопом | `src/labs/vkus/trichome.js` · `src/labs/vkus/trichome.css` |
| `pathway` | Вкус и кухня | Два конвейера аромата | `src/labs/vkus/pathway.js` · `src/labs/vkus/pathway.css` |
| `chemotype` | Вкус и кухня | Химический отпечаток сорта | `src/labs/vkus/chemotype.js` · `src/labs/vkus/chemotype.css` |
| `molecules` | Вкус и кухня |  | `src/labs/vkus/molecules.js` · `src/labs/vkus/molecules.css` |
| `heat` | Вкус и кухня | Когда класть базилик | `src/labs/vkus/heat.js` · `src/labs/vkus/heat.css` |
| `anthocyanin` | Вкус и кухня | Фиолетовый базилик и pH | `src/labs/vkus/anthocyanin.js` · `src/labs/vkus/anthocyanin.css` |
| `pairing` | Вкус и кухня | Лаборатория сочетаний | `src/labs/vkus/pairing.js` · `src/labs/vkus/pairing.css` |
| `storage` | Вкус и кухня | Сколько живёт срезанный базилик | `src/labs/vkus/storage.js` |
| `pesto` | Вкус и кухня | Песто-лаборатория | `src/labs/vkus/pesto.js` · `src/labs/vkus/pesto.css` |
| `pigment` | Проблемы | Смешайте пигменты | `src/labs/problemy/pigment.js` · `src/labs/problemy/pigment.css` |
| `dm` | Проблемы | Риск ложной мучнистой росы | `src/labs/problemy/dm.js` · `src/labs/problemy/dm.css` |
| `aphid` | Проблемы | Колония из одной тли | `src/labs/problemy/aphid.js` · `src/labs/problemy/aphid.css` |
| `weather` | Мой базилик | Погода глазами листа | `src/labs/moy/weather.js` · `src/labs/moy/weather.css` |
| `exlitmus` | Мой базилик |  | `src/labs/moy/exlitmus.js` |
| `exosmos` | Мой базилик |  | `src/labs/moy/exosmos.js` |
| `exgerm` | Мой базилик |  | `src/labs/moy/exgerm.js` |
| `exsweat` | Мой базилик |  | `src/labs/moy/exsweat.js` |
| `exlight` | Мой базилик |  | `src/labs/moy/exlight.js` |
| `exapex` | Мой базилик |  | `src/labs/moy/exapex.js` |
| `exroots` | Мой базилик |  | `src/labs/moy/exroots.js` |
| `exdark` | Мой базилик |  | `src/labs/moy/exdark.js` |

Общие помощники моделей — `src/labs/_frame.js`; инструменты графиков, кнопок и ползунков (`h.chart`, `h.plot`, `h.rangeHtml` …) — `src/js/science/`.

## Библиотеки рисунков (src/labs/_lib/)

Модель или `_shared.js` главы подключает библиотеку строкой `/* @use micro, ills */`; сборка кладёт её в файл главы один раз.

- `src/labs/_lib/agro.js` — agro: the plant's physics in numbers, shared by the models and the experiments
- `src/labs/_lib/food.js` — food: small illustrations of what basil goes with
- `src/labs/_lib/ills.js` — ills: plants, symptoms and pests for the illustrated guides
- `src/labs/_lib/micro.js` — micro: drawing a leaf under the microscope
- `src/labs/_lib/props.js` — props: things for the step-by-step pictures

Иллюстрации на страницах — элементы `data-ill="художник:вариант"`; художники регистрируются через `illustrate()` в `src/labs/<глава>/_shared.js` и рисуются, когда элемент подходит к экрану. Все рисунки главы на одном листе: `node tests/gallery.js <глава>`.

- `src/labs/formirovka/_shared.js`: `pinch`
- `src/labs/gidro/_shared.js`: `hyd`
- `src/labs/posadka/_shared.js`: `sow`, `shop`, `place`, `cut`
- `src/labs/problemy/_shared.js`: `sym`, `dis`, `pest`
- `src/labs/sorta/_shared.js`: `sort`, `vtype`, `seed`
- `src/labs/udobreniya/_shared.js`: `def`
- `src/labs/uhod/_shared.js`: `water`
- `src/labs/vkus/_shared.js`: `store`

## Скрипты (src/js/)

**app.js**
- `src/js/app/00-core.js` (128 стр.): MONTHS, MONTHS_NOM, MONTHS_SHORT, HAP, PAGES, PEEK
- `src/js/app/01-theme.js` (96 стр.): SKINS, initTheme
- `src/js/app/02-router.js` (297 стр.): ENTRY, initRouter, initPagers, initScrollChrome
- `src/js/app/03-peek.js` (264 стр.): PEEK_SKIP, initPeek, initPeekFrame
- `src/js/app/03-sheets.js` (212 стр.): initToc, initSheets
- `src/js/app/04-search-words.js` (137 стр.): AS_IS, LAYOUT_EN, SYNONYMS
- `src/js/app/04-search.js` (428 стр.): SEARCH_GROUPS, SEARCH_SKIP, SEARCH_BOX, SEARCH_STOP, FOUND_KEY, RECENT_KEY, initSearch
- `src/js/app/05-scene.js` (161 стр.): initScene, initHoverLight, initOffscreenPause, initLeafField
- `src/js/app/06-mini-plants.js` (32 стр.)
- `src/js/app/07-home.js` (60 стр.): initHome
- `src/js/app/08-varieties.js` (250 стр.): EASY, initVarieties, initQuiz
- `src/js/app/09-places.js` (45 стр.): initPlaces
- `src/js/app/10-soil.js` (26 стр.): initSoil
- `src/js/app/11-calendar.js` (227 стр.): initCalendar
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
- `src/js/app/22-garden-exps.js` (48 стр.)
- `src/js/app/22-garden-ics.js` (88 стр.): ICS_WEEKS
- `src/js/app/22-garden-photos.js` (104 стр.): PHOTO_DB
- `src/js/app/22-garden-view.js` (493 стр.): WEEKDAY, renderGardenBox, renderGardenHome, renderGardenForm, NOTE_NAMES, renderGardenPlant, renderGardenSheet, initGarden
- `src/js/app/22-garden-weather.js` (153 стр.): WX_KEY, WX_API, WX_DAY
- `src/js/app/22-garden.js` (138 стр.): GARDEN_KEY
- `src/js/app/22-install.js` (96 стр.): initInstall
- `src/js/app/22-reading-pos.js` (501 стр.): POS_KEY, READ_HEADS, READ_WHOLE, READ_BLOCK, SENT_END, READ_LEAD, USER_INPUT, HOLD_ENDS, DETOUR_KEY, initReadingPos, initLinks, initPageAction
- `src/js/app/23-boot.js` (24 стр.)

**science.js**
- `src/js/science/00-core.js` (20 стр.)
- `src/js/science/01-colors.js` (40 стр.)
- `src/js/science/02-controls.js` (30 стр.)
- `src/js/science/03-charts.js` (153 стр.)
- `src/js/science/04-astronomy.js` (22 стр.): CITIES
- `src/js/science/05-molecules.js` (315 стр.): FAM, MOLS, EXTRA, CHEMO, CHEMO_COLS, PAIRS, TILT, MolViewer
- `src/js/science/06-labs-loader.js` (233 стр.): SELF, draw, HIDDEN, drawDue
- `src/js/science/07-deep.js` (134 стр.): KIND, EASE, ANIMATED, initDeepAll, initDeep, initHomeMolecule, init

**scene.js**
- `src/js/scene/00-core.js` (8 стр.): TAU
- `src/js/scene/01-budget.js` (102 стр.): CALM, CALM_FPS
- `src/js/scene/02-noise.js` (22 стр.)
- `src/js/scene/03-wind.js` (22 стр.)
- `src/js/scene/04-background.js` (702 стр.): SPR_L, SCENE_SRC, IN_WORKER, TOKENS, initBackground
- `src/js/scene/05-plant.js` (49 стр.)
- `src/js/scene/06-plant-bitmaps.js` (382 стр.): LEAF_D, LEAF_BOX, LEAF_FILLS, Plant
- `src/js/scene/07-aroma.js` (41 стр.): NOTES

**data.js**
- `src/js/data/00-nav.js` (62 стр.): CHAPTERS, TOOLS, QUICK, MONTH_TIPS
- `src/js/data/01-varieties.js` (146 стр.): VARIETIES, VARIETY_TYPES, QUIZ
- `src/js/data/02-places.js` (71 стр.): PLACES, PRESETS, SOIL_RECIPES
- `src/js/data/03-nutrients.js` (127 стр.): ELEMENTS, STAGES, DOSE, NPK_PRESETS
- `src/js/data/04-problems.js` (112 стр.): P_LABEL, DIAG, DISEASES, PESTS, TREATMENTS
- `src/js/data/05-checklist.js` (30 стр.): CHECKLIST
- `src/js/data/06-recipes.js` (77 стр.): RECIPE_CATS, RECIPES
- `src/js/data/07-glossary.js` (59 стр.): GLOSSARY
- `src/js/data/08-garden.js` (100 стр.): GARDEN
- `src/js/data/09-weather.js` (35 стр.): WEATHER
- `src/js/data/10-experiments.js` (50 стр.): EXPERIMENTS

**skins.js**
- `src/js/skins/00-core.js` (40 стр.): SKINS, SELF_SRC, IN_WORKER, BAYER
- `src/js/skins/01-raster.js` (298 стр.): SHADED, FACES, ICO, OCT
- `src/js/skins/02-icons-druid.js` (70 стр.): DRUID_ICONS
- `src/js/skins/02-icons-grimoire-hand.js` (242 стр.): GRIMOIRE_HAND
- `src/js/skins/02-icons-grimoire.js` (1142 стр.): GRIMOIRE_ICONS
- `src/js/skins/02-icons.js` (83 стр.): PIX, ICON_SETS, BRAND
- `src/js/skins/02-textures.js` (199 стр.): FLOORS, RUNE_STROKES, GLYPH
- `src/js/skins/03-mol.js` (109 стр.): SHAPES, MOLDRAW, drawMol, MOLJOBS, MOLBUF
- `src/js/skins/04-stage.js` (457 стр.): WORLDS, PAIRS, ESSENCE, OFF
- `src/js/skins/05-grimoire-formirovka.js` (99 стр.)
- `src/js/skins/05-grimoire-gidro.js` (66 стр.)
- `src/js/skins/05-grimoire-glavnaya.js` (117 стр.)
- `src/js/skins/05-grimoire-moy.js` (79 стр.)
- `src/js/skins/05-grimoire-posadka.js` (47 стр.)
- `src/js/skins/05-grimoire-problemy.js` (64 стр.)
- `src/js/skins/05-grimoire-sorta.js` (58 стр.)
- `src/js/skins/05-grimoire-spravka.js` (63 стр.)
- `src/js/skins/05-grimoire-udobreniya.js` (59 стр.)
- `src/js/skins/05-grimoire-uhod.js` (57 стр.)
- `src/js/skins/05-grimoire-vkus.js` (61 стр.)
- `src/js/skins/05-grimoire.js` (106 стр.)
- `src/js/skins/06-druid-formirovka.js` (85 стр.)
- `src/js/skins/06-druid-gidro.js` (57 стр.)
- `src/js/skins/06-druid-glavnaya.js` (25 стр.)
- `src/js/skins/06-druid-moy.js` (53 стр.)
- `src/js/skins/06-druid-posadka.js` (47 стр.)
- `src/js/skins/06-druid-problemy.js` (85 стр.)
- `src/js/skins/06-druid-sorta.js` (58 стр.)
- `src/js/skins/06-druid-spravka.js` (53 стр.)
- `src/js/skins/06-druid-udobreniya.js` (67 стр.)
- `src/js/skins/06-druid-uhod.js` (46 стр.)
- `src/js/skins/06-druid-vkus.js` (47 стр.)
- `src/js/skins/06-druid.js` (513 стр.): PHASE_TODAY, BLOOM, GROVEMOL
- `src/js/skins/07-crypt.js` (64 стр.)
- `src/js/skins/07-forest.js` (447 стр.)
- `src/js/skins/08-ills.js` (84 стр.): SVGNS, KEEP, CELL_PX, STEPS, BAYER_PNG
- `src/js/skins/08-words.js` (147 стр.): ROMAN, ORD, WORDS, PATTERNS, WORD_AT, PLACEHOLDER
- `src/js/skins/09-start.js` (61 стр.): BACKS

## Стили (src/css/)

**style.css**: `00-tokens.css`, `01-base.css`, `02-ambient.css`, `03-header.css`, `04-controls.css`, `05-views.css`, `06-blocks.css`, `07-chapter-art.css`, `08-home.css`, `09-chapter-chrome.css`, `10-varieties.css`, `11-places.css`, `12-steps.css`, `13-calendar.css`, `14-care.css`, `15-fertilizers.css`, `16-pinching.css`, `17-harvest.css`, `18-problems.css`, `19-reference.css`, `20-footer.css`, `21-sheets.css`, `22-selection.css`, `23-garden.css`, `24-toc.css`, `25-peek.css`, `26-hydro.css`, `26-skin-art.css`, `27-grimoire.css`, `28-druid.css`
**lab.css**: `00-aroma.css`, `00-ill.css`, `00-micro.css`, `00-tokens.css`, `01-hero.css`, `04-deep-kinds.css`, `05-deep.css`, `06-lab-tools.css`, `07-vkus.css`, `08-home-science.css`, `09-hover-light.css`, `11-deep-footer.css`, `12-sci-notes.css`, `13-recipes.css`, `14-paint.css`, `15-nav-helpers.css`, `16-grimoire.css`, `17-druid.css`

