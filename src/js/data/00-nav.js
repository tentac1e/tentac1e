
  const CHAPTERS = [
    { id: 'sorta', num: 1, title: 'Сорта', art: 'art-sorta', desc: '26 сортов, подбор под ваши условия, как выбрать семена и собрать свои.' },
    { id: 'posadka', num: 2, title: 'Посадка', art: 'art-posadka', desc: 'Где растить, сроки под ваш климат, посев и рассада, магазинный горшок, грунт и черенки.' },
    { id: 'uhod', num: 3, title: 'Уход', art: 'art-uhod', desc: 'Свет, полив, тепло, почва и уход по сезонам.' },
    { id: 'udobreniya', num: 4, title: 'Удобрения', art: 'art-udobreniya', desc: 'Элементы питания, подкормки по стадиям, план и калькуляторы.' },
    { id: 'gidro', num: 5, title: 'Гидропоника', art: 'art-gidro', desc: 'Базилик без земли: как работают системы, банка и ведро своими руками, раствор, проверки и сколько это стоит.' },
    { id: 'formirovka', num: 6, title: 'Прищипка и сбор', art: 'art-formirovka', desc: 'Как сделать из стебля густой куст и когда собирать урожай. С тренажёром.' },
    { id: 'vkus', num: 7, title: 'Вкус и кухня', art: 'art-vkus', desc: 'Химия аромата, 3D-молекулы, физика кухни, сочетания, хранение и 17 рецептов.' },
    { id: 'problemy', num: 8, title: 'Проблемы', art: 'art-problemy', desc: 'Диагностика по симптомам, болезни, вредители, профилактика.' },
    { id: 'spravka', num: 9, title: 'Справка', art: 'art-spravka', desc: 'Частые вопросы, словарь терминов, чек-лист сезона и любопытные факты.' }
  ];

  // group: what the reader wants to do — the contents and the home page show the tools by it (TOOL_GROUPS in
  // scripts/build.py); «mine» is «Мой базилик», which has its own place in both
  const TOOLS = [
    { title: 'Мой базилик', hash: 'moy', icon: 'sprout', group: 'mine', desc: 'Свои кусты, их дела на неделю, погода и опыты' },
    { title: 'Подбор сорта', hash: 'sorta-podbor', icon: 'seed', group: 'plan', desc: '4 вопроса — 3 подходящих сорта' },
    { title: 'Калькулятор грунта', hash: 'posadka-gorshok', icon: 'pot', group: 'calc', desc: 'Сколько литров каждого компонента', peek: 'soil-tool' },
    { title: 'Календарь посадки', hash: 'posadka-sroki', icon: 'cal', group: 'plan', desc: 'Даты посева, высадки и сбора', peek: 'kalendar-tool' },
    { title: 'Калькулятор досветки', hash: 'dli', icon: 'lamp', group: 'calc', desc: 'Хватает ли света от лампы' },
    { title: 'Питание по стадиям', hash: 'udobreniya-stadii', icon: 'flask', group: 'know', desc: 'Кривая потребности в N, P, K' },
    { title: 'План подкормок', hash: 'udobreniya-plan', icon: 'list', group: 'plan', desc: 'Даты и дозы на весь сезон' },
    { title: 'Расшифровка NPK', hash: 'npk', icon: 'tag', group: 'calc', desc: 'Для чего подходит ваше удобрение' },
    { title: 'Калькулятор раствора', hash: 'udobreniya-kalkulyator', icon: 'jar', group: 'calc', desc: 'Граммы и ложки на объём воды' },
    { title: 'Системы гидропоники', hash: 'gidro-osnovy', icon: 'drop', group: 'know', desc: 'Шесть систем в разрезе: где корни берут воздух', peek: 'hsys-tool' },
    { title: 'Раствор для гидропоники', hash: 'gidro-rastvor', icon: 'flask', group: 'calc', desc: 'Миллилитры частей A и B под нужную EC', peek: 'hmix-tool' },
    { title: 'Проверка раствора', hash: 'gidro-proverki', icon: 'check', group: 'plan', desc: 'EC, pH и температура — что делать сейчас', peek: 'hcheck-tool' },
    { title: 'Тренажёр прищипывания', hash: 'formirovka-trenazher', icon: 'scissors', group: 'know', desc: 'Вырастите куст на 8 верхушек' },
    { title: 'Молекулы аромата', hash: 'vkus-molekuly', icon: 'hex', group: 'know', desc: '9 молекул в 3D и шкала летучести' },
    { title: 'Лаборатория сочетаний', hash: 'vkus-sochetaniya', icon: 'nose', group: 'know', desc: 'Общие молекулы базилика и продуктов' },
    { title: 'Когда добавлять базилик', hash: 'vkus-kuhnya', icon: 'thermo', group: 'know', desc: 'Модель: что остаётся от аромата при варке' },
    { title: 'Калькулятор VPD', hash: 'deep-vpd', icon: 'wave', group: 'calc', desc: 'Температура и влажность глазами листа' },
    { title: 'Песто-лаборатория', hash: 'deep-pesto', icon: 'jar', group: 'know', desc: 'Почему песто темнеет и как этого избежать' },
    { title: 'Диагностика', hash: 'problemy-diagnostika', icon: 'bug', group: 'know', desc: '21 симптом: причины и лечение' },
    { title: 'Чек-лист сезона', hash: 'spravka-chek-list', icon: 'check', group: 'plan', desc: 'Отмечайте сделанное' }
  ];

  const QUICK = [
    { title: 'Купил базилик в магазине', desc: 'Как спасти горшок, пока не поздно', hash: 'posadka-magazin', icon: 'bag' },
    { title: 'Хочу вырастить из семян', desc: 'Посев и рассада по шагам', hash: 'posadka-posev', icon: 'seed' },
    { title: 'Выращиваю дома зимой', desc: 'Свет, лампа и режим', hash: 'uhod-svet', icon: 'lamp' },
    { title: 'Сажаю на грядку или в теплицу', desc: 'Сроки под ваш климат', hash: 'posadka-sroki', icon: 'garden' },
    { title: 'Пора подкормить', desc: 'Что давать на этой стадии', hash: 'udobreniya-stadii', icon: 'flask' },
    { title: 'С листьями что-то не так', desc: 'Найдите причину по симптому', hash: 'problemy-diagnostika', icon: 'bug' }
  ];

  const MONTH_TIPS = [
    'Дома можно сеять с лампой на 14–16 часов. Хорошее время проверить старые семена на всхожесть.',
    'Закупите семена и грунт. Для зимней зелени на подоконнике — посев только с досветкой.',
    'Конец марта — посев на рассаду для теплиц. Без лампы сеянцы вытянутся.',
    'Главный месяц посева на рассаду для открытого грунта. Ранние посевы пора пикировать.',
    'Закаливайте рассаду и высаживайте в теплицу. На юге базилик уже можно сажать в грунт.',
    'Высадка в открытый грунт, когда ночи теплее +10 °C. Первое прищипывание рассады.',
    'Пик роста: срезки каждые 1–2 недели, подкормки после срезок, удаление бутонов.',
    'Аромат на максимуме — время заготовок. В конце месяца нарежьте черенки на зиму.',
    'Укореняйте черенки для подоконника, делайте заготовки и соберите всё до первых заморозков.',
    'Базилик переезжает на подоконник: лампа 14–16 часов, умеренный полив, подальше от батареи.',
    'Дома: свет и тепло важнее подкормок. Кормите раз в 2–3 недели половинной дозой.',
    'Подсейте новую партию для зимней зелени и следите за сухим воздухом от отопления.'
  ];

