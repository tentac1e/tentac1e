# Гид по базилику — как работать с проектом

Статический сайт на русском: 12 страниц, vanilla JS без фреймворков и зависимостей. Хостинг — REG.RU (Apache), домен ocimum.ru.

**Где что лежит — в `MAP.md`** (его пишет сборка): каждая вкладка главы с файлом, модели, развороты «Глубже», куски скриптов и стилей. Читайте `MAP.md` вместо того, чтобы открывать главы целиком.

## Правила

- Правится только `src/`, `scripts/`, `tests/`, `README.md`, `CLAUDE.md`. Файлы `assets/`, `*.html` в корне и `MAP.md` собирает `scripts/build.py`: после правки в `src/` запустите сборку.
- Ничего не вырезать, не удалять и не сжимать ради скорости: текст, модели и возможности остаются. Скорость — только оптимизацией. Сгенерированные файлы не минифицируются.
- Тексты для читателя — по-русски: «ёлочки», неразрывный пробел между числом и единицей (`20&nbsp;°C`, в JS — `h.nb()`), минус `−`, тире `—`, диапазоны через `–`.
- Цвета — только токенами из `src/css/style/00-tokens.css` и `src/css/lab/00-tokens.css`, у каждого есть пара для тёмной темы.
- В коммитах, файлах и описаниях PR не упоминать название модели ИИ. Ветка: `claude/basil-growing-guide-site-2netl6`.

## Исходники

```
src/layout.html                   каркас всех страниц: шапка, SVG-спрайт, фон, подвал, поиск, листы
src/pages/<глава>/_head.html      обложка главы и строка вкладок
src/pages/<глава>/N-<вкладка>.html  одна вкладка: <div class="panel" data-panel id="<глава>-<вкладка>" data-title="…">
src/pages/<глава>/_foot.html      подвал главы (пейджер)
src/pages/glavnaya.html, kalendar.html   главы без вкладок — одним файлом
src/js/<модуль>/_frame.js + NN-*.js      → assets/js/<модуль>.js  (app — интерфейс, science — развороты и
                                          инструменты моделей, scene — фон и живой куст, data — данные)
src/js/haptics.js                 тактильный отклик → assets/js/haptics.js
src/css/style/NN-*.css            → assets/css/style.css
src/css/lab/NN-*.css              → assets/css/lab.css (на месте /*@labs*/ — стили всех моделей)
src/labs/_frame.js                общие помощники моделей
src/labs/<глава>/<модель>.js      одна модель; рядом <модель>.css; _shared.js — общее для моделей главы
                                  → assets/js/labs/<глава>.js, страница грузит его, только когда модель рядом
```

Куски `NN-*.js` — тело одной общей функции (`_frame.js`): имена, объявленные в одном куске, видны в следующих.

## Команды

```sh
python3 scripts/build.py                          # страницы в корне (ссылки sorta.html) + assets/ + MAP.md
python3 scripts/build.py --clean --out dist/site  # версия для хостинга: адреса /урожай, .htaccess
python3 scripts/build.py --single out.html        # книга одним файлом
python3 scripts/serve.py                          # dist/site на http://127.0.0.1:8790 с правилами .htaccess

sh tests/run.sh                                   # обе сборки и все проверки (печатает только провалы)
node tests/labs.js trichome,pairing --shots       # модели: подписи, наложения, края; снимки в tests/out/
node tests/labs.js --phone --shots --dark         # только телефон, тёмная тема
```

Проверки (Playwright + Chromium, `tests/`): `pages` — сборка в корне, `clean` — адреса хостинга, `nav` — навигация и «Продолжить», `labs` — все модели, `single` — книга одним файлом. Снимки смотрите глазами: тест ловит обрезанные, налезающие и мелкие (< 9 px) подписи, но не некрасивое.

## Модели

Модель — `register('имя', el => { … })` в `src/labs/<глава>/<имя>.js`; на странице — `<div class="lab-tool" data-lab="имя" data-kind="chem|phys|bio|taste"></div>` (цвет дисциплины). Помощники — объект `h` (`src/js/science/`):

- разметка: `h.head(заголовок, пояснение, модель?)`, `h.rangeHtml`, `h.segHtml`, `h.chipsHtml`, `h.readHtml([[подпись, id]])`;
- поведение: `h.bindRange(el, id, показать, onChange)`, `h.bindPick(el, id, onChange)`;
- графика: `h.chart(host, { h: w => высота, draw(w, h) { return '<svg-разметка>' }, onPointer })` — SVG в реальных пикселях, перерисовка при смене ширины; `h.plot({...})` — оси, линии, полосы;
- числа и текст: `h.fmt`, `h.fmt0`, `h.nb`, `h.esc`, `h.sub`, цвета `h.mix`, `h.ramp`, `h.css('--токен')`;
- данные вкуса: `h.MOLS`, `h.FAM`, `h.CHEMO`, `h.PAIRS`, `h.MolViewer`.

Подписи в SVG — не мельче 9 px на экране телефона и внутри рамки схемы; на узком экране схема перестраивается, а не сжимается. Анимации — через `S.gate()` из `window.BasilScene` (общий бюджет кадров) и с остановкой вне экрана.

## Новая вкладка

1. `src/pages/<глава>/N-<вкладка>.html` с `data-panel id="<глава>-<вкладка>"`.
2. Короткий русский якорь — в `TAB` в `scripts/build.py`.
3. Ссылка в `.subnav` в `_head.html`.

## Выкладка

`python3 scripts/build.py --clean --out dist/site`, затем архив содержимого `dist/site` (вместе с `.htaccess`) — его пользователь распаковывает в `www/ocimum.ru/` на REG.RU.
