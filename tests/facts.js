/* Ключевые цифры гида одни и те же во всех главах. Аудит нашёл три расхождения, которые никто не заметил:
   рост встаёт «при 12 °C» на главной и на шкале тепла, а в «Посадке», погоде и «Моём базилике» — «ниже +10 °C»;
   семена «не старше 4–5 лет» в чек-листе и «не старше 2–3 лет» в «Сортах»; PPFD 250–400 в карточке гидропоники
   и 200–400 везде ещё. Здесь у каждого факта — узкие шаблоны фраз, в которых он сказан, и эталон: число из каждой
   найденной фразы должно с ним совпасть. Законное исключение (у тулси свой порог, лампа досвечивает окно не весь
   день) — шаблоном в allow с причиной рядом.

   Ищет в исходниках, без браузера: src/pages (текст страниц), src/js/data (данные интерфейса), src/labs (модели);
   теги, сущности, комментарии и неразрывные пробелы сняты.
   node tests/facts.js            проверить
   node tests/facts.js --show     каждую найденную фразу с числом — чтобы дописать шаблон */
const fs = require('fs');
const path = require('path');
const { ROOT, ok, done } = require('./lib');

// «a–b» or «a» from the groups a pattern caught
const val = m => m.slice(1).filter(Boolean).join('–').replace(/\./g, ',');

const FACTS = [
  { name: 'рост встаёт ниже +10 °C', want: '10', min: 7, find: [
    /(?:ниже|холоднее|при)\s\+?(\d+)\s°C,?\s(?:рост\s(?:стоп|встаёт|встанет)|останавлива\S*|останавливают рост|базилик перестаёт расти|рост останавливается)/,
    /Остановка роста\s(?:ниже\s)?\+?(\d+)\s°C/,
    /ниже\s\+?(\d+)\s°C\s(?:ферменты листа работают вполсилы|всё почти стоит)/],
    allow: [/Ниже 15 °C останавливается/] }, // тулси, тропический вид: свой порог в карточке сорта
  { name: 'ночью не ниже 16 °C', want: '16', min: 3, find: [/ночью не ниже\s\+?(\d+)\s°C/, /не ниже\s\+?(\d+)\s°C ночью/] },
  { name: 'высадка, когда ночи теплее +10 °C', want: '10', min: 5, find: [/ноч(?:и|ей)(?:\s\S+){0,4}\sтеплее\s\+?(\d+)\s°C/, /\+?(\d+)\s°C минимум ночью/] },
  { name: 'высадка в почву, прогретую до +15 °C', want: '15', min: 3, find: [/почв\S*(?:\s\S+){0,5}\sпрогрел\S* до\s\+?(\d+)\s°C/, /почва\s\+(\d+)\s°C/] },
  { name: 'всходы при 22–25 °C', want: '22–25', min: 4, find: [
    /(\d+)–(\d+)\s°C до всходов/, /при\s(\d+)–(\d+)\s°C всходы/, /всходов при\s(\d+)–(\d+)\s°C/, /Прорастание(?: семян)?\s(\d+)–(\d+)\s°C/] },
  { name: 'всходы за 5–10 дней', want: '5–10', min: 3, find: [/всходы(?:\s\S+){0,2}\sза\s(\d+)–(\d+)\sдн/, /(\d+)–(\d+)\sдней до всходов/] },
  { name: 'семена в 1 г — 600–800 штук', want: '600–800', min: 2, find: [/(\d+)–(\d+) семян в 1 г/, /в 1 г(?:\s\S+){0,2}\s(\d+)–(\d+)\sштук/] },
  { name: 'глубина посева 0,5–1 см', want: '0,5–1', min: 2, find: [/(?:на глубину|заделка)\s(\d[,.]\d)–(\d)\sсм/] },
  { name: 'всхожесть держится 4–5 лет', want: '4–5', min: 3, find: [/всхожест\S*(?:\s\S+){0,3}\s(\d+)–(\d+)\sлет/, /(\d+)–(\d+)\sлет сохраняется всхожесть/] },
  { name: 'семена лучше не старше 2–3 лет', want: '2–3', min: 2, find: [/не старше\s(\d+)–(\d+)\sлет/] },
  { name: 'схема посадки 25–30 × 40 см', want: '25–30–40', min: 2, find: [/схем\S*\s(\d+)–(\d+)\s×\s(\d+)\sсм/] },
  { name: 'солнце 6–8 часов', want: '6–8', min: 2, find: [/(\d+)–(\d+)\sч(?:асов)? (?:прямого )?солнца/],
    allow: [/запад 3–5 ч солнца/] }, // таблица окон: восточному и западному окну солнца меньше — так и сказано
  { name: 'под лампой 14–16 часов', want: '14–16', min: 8, find: [
    /(?:лампа|лампой|лампу|досветк\S*)(?:\s(?:на|в|по|до|около))?\s(\d+)–(\d+)\s(?:ч\b|час)/, /(\d+)–(\d+)\s(?:ч|часов) под лампой/],
    allow: [/лампа 10–12 ч/, /лампа 8–10 ч/] }, // таблица окон: лампа досвечивает окно, а не светит весь день
  { name: 'полив, когда подсохли верхние 1–2 см', want: '1–2', min: 3, find: [/верхние\s(\d+)–(\d+)\sсм/] },
  { name: 'влажность воздуха 40–60 %', want: '40–60', min: 2, find: [/влажность\S*(?:\s\S+){0,2}\s(\d+)–(\d+)\s%/] },
  { name: 'PPFD 200–400 мкмоль/м²·с', want: '200–400', min: 3, find: [/PPFD\s(\d+)–(\d+)/] },
  { name: 'DLI 12–17 моль/м²', want: '12–17', min: 2, find: [/DLI\s(\d+)–(\d+)/] },
  { name: 'VPD 0,8–1,2 кПа', want: '0,8–1,2', min: 2, find: [/VPD\S*\s(\d[,.]\d)–(\d[,.]\d)\sкПа/, /оптимум\s(\d[,.]\d)–(\d[,.]\d)\sкПа/] },
  { name: 'pH почвы 6,0–7,0', want: ['6,0–7,0', '6–7'], min: 4, find: [/(?:почв\S*|грунт\S*|кислотность)(?:\s\S+){0,3},?\spH\s(\d(?:[,.]\d)?)–(\d(?:[,.]\d)?)/, /pH\s(?:грунта|почвы)\s(\d(?:[,.]\d)?)–(\d(?:[,.]\d)?)/] },
  { name: 'pH раствора 5,5–6,5', want: '5,5–6,5', min: 2, find: [/(?:гидропоник\S*|раствор\S*)(?:\s\S+){0,4},?\spH\s(\d[,.]\d)–(\d[,.]\d)/, /pH и EC в гидропонике\s(\d[,.]\d)–(\d[,.]\d)/],
    allow: [/pH 5,8–6,2/] }, // первая неделя рассады в растворе — уже середина того же коридора
  { name: 'раствор 18–22 °C', want: '18–22', min: 5, find: [/раствор\S*(?:\s\S+){0,4}\s(\d+)–(\d+)\s°C/] },
  { name: 'раствор теплее 24 °C — корни гниют', want: '24', min: 5, find: [
    /(?<!не\s)(?:выше|теплее)\s(\d+)\s°C(?:\s\S+){0,4}\s(?:корни|гни\S*|питиум\S*|раздолье|кислород\S*)/, /вредит выше\s(\d+)\s°C/,
    /(\d+)\s°C рабочий порог/, /корневой гнили раствор\s(\d+)\s°C/, /раствор\S* теплее\s(\d+)\s°C/] },
  { name: 'срез — не больше трети куста', want: 'трети', min: 4, find: [/не больше\s(трети|половины|четверти)\sкуста/] }
];

function sentences() {
  const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
  const files = [...walk(path.join(ROOT, 'src/pages')).filter(f => f.endsWith('.html')),
    ...walk(path.join(ROOT, 'src/js/data')).filter(f => f.endsWith('.js')),
    ...walk(path.join(ROOT, 'src/labs')).filter(f => f.endsWith('.js'))];
  const ent = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', laquo: '«', raquo: '»', mdash: '—', ndash: '–', minus: '−', thinsp: ' ', hellip: '…' };
  const out = [];
  for (const f of files) {
    let t = fs.readFileSync(f, 'utf8');
    if (f.endsWith('.js')) t = t.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');
    t = t.replace(/<[^>]+>/g, ' ').replace(/&([a-z]+);/g, (m, e) => ent[e] || ' ').replace(/[\u00a0\u202f\u2009]/g, ' ').replace(/[\u2060\u00ad]/g, '').replace(/\s+/g, ' ');
    // a row of data (['Раствор, t°', '18–22 °C; …']) reads as «Раствор, t° — 18–22 °C; …»; rows and sentences apart
    t = t.replace(/(['"`]),\s*(['"`])/g, ' — ');
    t.split(/(?<=[.!?])\s+|['"`]\s*\]/).forEach(s => { if (/\d/.test(s)) out.push([path.relative(ROOT, f), s.trim()]); });
  }
  return out;
}

const show = process.argv.includes('--show');
const all = sentences();
for (const fact of FACTS) {
  const found = [], wrong = [];
  for (const [f, s] of all) {
    for (const re of fact.find) {
      const g = new RegExp(re.source, 'gi');
      for (const m of s.matchAll(g)) {
        // an exception named in allow: the words around this very phrase, not the whole row it stands in
        if ((fact.allow || []).some(a => a.test(s.slice(Math.max(0, m.index - 40), m.index + m[0].length + 40)))) continue;
        const v = val(m);
        found.push(v);
        if (show) console.log(`  ${fact.name.padEnd(36)} ${v.padEnd(10)} ${f}: …${s.slice(Math.max(0, m.index - 30), m.index + m[0].length + 20)}…`);
        if (![].concat(fact.want).includes(v)) wrong.push(`${f}: «${v}» — …${s.slice(Math.max(0, m.index - 40), m.index + m[0].length + 30)}…`);
      }
    }
  }
  ok(!wrong.length && found.length >= fact.min, `${fact.name}: сказано ${found.length} раз${found.length < fact.min ? ` (ждали не меньше ${fact.min}: шаблон больше не находит фразы — текст изменился?)` : ''}${wrong.length ? '\n    ' + wrong.join('\n    ') : ''}`);
}
done();
