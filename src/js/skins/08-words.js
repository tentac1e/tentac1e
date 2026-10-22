  /* ------------------------------------------------------------------ */
  /* the words of each skin: the labels of the guide in its own tongue — */
  /* the grimoire's treatise, the grove's saga — and their meaning as     */
  /* plain as before. Only the frame of the guide speaks so (labels,      */
  /* buttons, the heads of its parts), never the text of a chapter. The   */
  /* plain words stay in data-plain: switched off, the guide gets them     */
  /* back, and the place of reading goes by them (22-reading-pos.js)       */
  /* ------------------------------------------------------------------ */
  const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  const ORD = ['', 'первая', 'вторая', 'третья', 'четвёртая', 'пятая', 'шестая', 'седьмая', 'восьмая', 'девятая', 'десятая', 'одиннадцатая', 'двенадцатая'];
  const roman = n => ROMAN[n] || n, ord = n => ORD[n] || n;
  // the plain words (spaces as plain spaces) and the skin's; the numbered ones by pattern
  const WORDS = {
    grimoire: {
      'гид садовода': 'гримуар садовода',
      'Оглавление': 'Оглавление гримуара',
      'Инструменты': 'Приборы алхимика',
      'Растите с удовольствием и ешьте песто ✿': 'Растите с усердием и толките песто, как зелье ✠',
      'от семечка до песто': 'от семени до зелья песто',
      'С чего начать': 'С чего начать посвящение',
      'Все главы': 'Все главы трактата',
      'Продолжить чтение': 'Вернуться к закладке',
      'гида': 'гримуара',
      'Научный слой': 'Тайное знание',
      'Карманный агроном': 'Карманный гримуар',
      'Дальше в главе': 'Перевернуть страницу',
      'Готово →': 'Трактат прочитан →',
      'Для любопытных': 'Тайны для любопытных',
      'Раскрыть все': 'Раскрыть все тайны',
      'Свернуть все': 'Сокрыть все тайны',
      'Подробнее': 'Глубже в трактат',
      'Частые вопросы': 'Частые вопросы учеников',
      'Все частые вопросы': 'Все вопросы учеников',
      'Откуда это известно': 'Из каких книг это знание',
      'Свернуть разворот': 'Закрыть свиток',
      'Интерактив': 'Опыт алхимика',
      'Модель': 'Модель мироздания',
      'Вы остановились здесь': 'Здесь ваша закладка',
      'Вернуться к тексту': 'Вернуться к строке',
      'Открыть в главе': 'Открыть в гримуаре'
    },
    druid: {
      'гид садовода': 'советы друида',
      'Оглавление': 'Карта рощи',
      'Инструменты': 'Утварь друида',
      'Растите с удовольствием и ешьте песто ✿': 'Растите в ладу с рощей и ешьте песто ᛉ',
      'от семечка до песто': 'от семечка до песто, по заветам рощи',
      'С чего начать': 'С чего начать путь',
      'Все главы': 'Все главы саги',
      'Продолжить чтение': 'Продолжить путь',
      'гида': 'саги',
      'Научный слой': 'Знание корней',
      'Карманный агроном': 'Карманный друид',
      'Дальше в главе': 'Дальше по тропе',
      'Готово →': 'Тропа пройдена →',
      'Для любопытных': 'Предания для любопытных',
      'Раскрыть все': 'Раскрыть все предания',
      'Свернуть все': 'Свернуть все предания',
      'Подробнее': 'Глубже, к корням',
      'Частые вопросы': 'О чём спрашивают у костра',
      'Все частые вопросы': 'Все вопросы у костра',
      'Откуда это известно': 'Откуда это знание',
      'Свернуть разворот': 'Свернуть предание',
      'Интерактив': 'Попробуйте сами',
      'Модель': 'Модель рощи',
      'Вы остановились здесь': 'Здесь вы сошли с тропы',
      'Вернуться к тексту': 'Вернуться на тропу',
      'Открыть в главе': 'Пойти туда'
    }
  };
  const PATTERNS = {
    grimoire: [
      [/^Глава (\d+)$/, (m, n) => `Глава ${roman(+n)}`],
      [/^← Глава (\d+)$/, (m, n) => `← Глава ${roman(+n)}`],
      [/^Глава (\d+) →$/, (m, n) => `Глава ${roman(+n)} →`],
      [/^Гид по выращиванию/, 'Гримуар выращивания']
    ],
    druid: [
      [/^Глава (\d+)$/, (m, n) => `Глава ${ord(+n)}`],
      [/^← Глава (\d+)$/, (m, n) => `← Глава ${ord(+n)}`],
      [/^Глава (\d+) →$/, (m, n) => `Глава ${ord(+n)} →`],
      [/^Гид по выращиванию/, 'Знание рощи о выращивании']
    ]
  };
  // where the skins put their words: the first words of each of these (written by the build or later by the page)
  const WORD_AT = ['.brand small', '#sheet-toc-h', '.toc-seg button', '.footer .hand', '.hero h1 em', '.hero .lead', '.hero-actions .btn',
    '#continue > span', '#glavy-h em', '#tools-h', '#nauka .eyebrow', '.ch-hero .eyebrow', '.pager small', '.panel-next small',
    '.deep-zone-label > span', '[data-deep-all]', '.deeper-k', '.faq-here h3', '.faq-more a', '.deep-src-h', '.deep-close',
    '.lab-kicker', '.resume-pill small', '.peek-go > span'].join(', ');
  const PLACEHOLDER = {
    grimoire: 'Что ищем в гримуаре? Например, желтеют листья',
    druid: 'О чём спросить рощу? Например, желтеют листья'
  };

  // a label in the skin's words (the plain one when no skin is on, or it has no word for it)
  function say(text, skin = skinNow()) {
    if (!skin || !WORDS[skin]) return text;
    const t = text.trim(), key = t.replace(/ /g, ' '), w = WORDS[skin][key];
    if (w) return text.replace(t, w);
    for (const [re, to] of PATTERNS[skin]) if (re.test(key)) return text.replace(t, key.replace(re, to));
    return text;
  }
  const wordNode = el => [...el.childNodes].find(n => n.nodeType === 3 && n.data.trim());
  function putWords(el, skin) {
    const n = wordNode(el);
    if (!n) return;
    // already in the skin's words; else what stands there now is the plain one (the page may have written it again)
    if (el.dataset.plain != null && n.data === say(el.dataset.plain, skin)) return;
    const plain = n.data, w = say(plain, skin);
    if (w === plain) { delete el.dataset.plain; return; }
    el.dataset.plain = plain;
    n.data = w;
  }
  // what the page builds or writes again later (a lab's head, the pill of the reading place, «Раскрыть все» once
  // pressed) gets the words as it comes; drawings are passed by at once
  const wordWatch = new MutationObserver(records => {
    const skin = skinNow();
    if (!skin) return;
    for (const r of records) {
      const t = r.target;
      if (t.nodeType !== 1 || t instanceof SVGElement) continue;
      if (t.matches(WORD_AT)) putWords(t, skin);
      r.addedNodes.forEach(n => {
        if (n.nodeType !== 1 || n instanceof SVGElement) return;
        if (n.matches(WORD_AT)) putWords(n, skin);
        n.querySelectorAll(WORD_AT).forEach(e => putWords(e, skin));
      });
    }
  });
  function wordsOn(skin) {
    $$(WORD_AT).forEach(el => putWords(el, skin));
    const q = $('#search-input');
    if (q) { if (q.dataset.plainPh == null) q.dataset.plainPh = q.placeholder; q.placeholder = PLACEHOLDER[skin] || q.dataset.plainPh; }
    wordWatch.observe(doc.body, { childList: true, subtree: true });
  }
  function wordsOff() {
    wordWatch.disconnect();
    $$('[data-plain]').forEach(el => { const n = wordNode(el); if (n) n.data = el.dataset.plain; delete el.dataset.plain; });
    const q = $('#search-input');
    if (q && q.dataset.plainPh != null) { q.placeholder = q.dataset.plainPh; delete q.dataset.plainPh; }
  }
