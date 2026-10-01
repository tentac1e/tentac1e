  /* ================================================================== */
  /* SEARCH: words — stems, the keyboard layout, typos, synonyms         */
  /* ================================================================== */
  const norm = s => String(s).toLowerCase().replace(/ё/g, 'е');
  // a letter or a digit of a word (after norm)
  const isWordChar = c => (c >= 'а' && c <= 'я') || (c >= 'a' && c <= 'z') || (c >= '0' && c <= '9');

  // Snowball's Russian stemmer, made careful for search: an ending comes off only when a stem of three
  // letters or more is left — four for the gerund rule, or «полив» would turn into «пол»
  const stemRu = (() => {
    const PERF = /(?:([ая])(?:вшись|вши|в)|ившись|ывшись|ивши|ывши|ив|ыв)$/;
    const REFL = /(?:ся|сь)$/;
    const ADJ = /(?:ими|ыми|его|ого|ему|ому|ее|ие|ые|ое|ей|ий|ый|ой|ем|им|ым|ом|их|ых|ую|юю|ая|яя|ою|ею)$/;
    const PART = /(?:([ая])(?:ем|нн|вш|ющ|щ)|ивш|ывш|ующ)$/;
    const VERB = /(?:([ая])(?:ла|на|ете|йте|ли|й|л|ем|н|ло|но|ет|ют|ны|ть|ешь|нно)|ила|ыла|ена|ейте|уйте|ите|или|ыли|ей|уй|ил|ыл|им|ым|ен|ило|ыло|ено|ят|ует|уют|ит|ыт|ены|ить|ыть|ишь|ую|ю)$/;
    const NOUN = /(?:иями|ями|ами|ией|иям|ием|иях|ев|ов|ие|ье|еи|ии|ей|ой|ий|ям|ем|ам|ом|ах|ях|ию|ью|ия|ья|а|е|и|й|о|у|ы|ь|ю|я)$/;
    return w => {
      const v = /[аеиоуыэюя]/.exec(w);
      if (!v) return w;
      // the endings are looked for after the first vowel; «а» or «я» before some of them stays
      const pre = w.slice(0, v.index + 1);
      const cut = (rv, re, min) => {
        const r = rv.replace(re, (m, g) => (typeof g === 'string' ? g : ''));
        return r !== rv && pre.length + r.length >= min ? r : null;
      };
      let rv = w.slice(v.index + 1), r;
      if ((r = cut(rv, PERF, 4)) !== null) rv = r;
      else {
        if ((r = cut(rv, REFL, 3)) !== null) rv = r;
        if ((r = cut(rv, ADJ, 3)) !== null) { const p = cut(r, PART, 3); rv = p !== null ? p : r; }
        else if ((r = cut(rv, VERB, 3)) !== null) rv = r;
        else if ((r = cut(rv, NOUN, 3)) !== null) rv = r;
      }
      let out = pre + rv;
      if (out.length > 3 && out.endsWith('и')) out = out.slice(0, -1);
      if (/нн$/.test(out)) out = out.slice(0, -1);
      else if (/ейше?$/.test(out) && out.length > 6) out = out.replace(/ейше?$/, '').replace(/нн$/, 'н');
      else if (out.length > 3 && out.endsWith('ь')) out = out.slice(0, -1);
      return out;
    };
  })();

  // what a query word is looked for as: the stem, cut a little further for search — the verb endings
  // Snowball leaves («желтеют» → «желт»), the vowel before a verb ending («поливать» → «полив»),
  // and for «горшок», «черенок» also the stem without the fleeting vowel («горшк-», «черенк-»)
  // words that do not change (or must not be cut: «песто» is not «пёстрый»)
  const AS_IS = new Set(['песто', 'писту', 'капрезе', 'пюре', 'кешью', 'тофу', 'соте', 'фондю', 'кофе', 'какао', 'бенто']);
  function keysOf(w) {
    if (!/[а-я]/.test(w) || AS_IS.has(w)) return [w]; // Latin names and numbers: as typed
    let s = stemRu(w);
    const r = s.replace(/[еая]?(?:ют|ут|ет|ит|ят)$/, '');
    if (r !== s && r.length >= 4) s = r;
    if (/[аяе]$/.test(s) && s.length >= 5) s = s.slice(0, -1);
    if (/ост$/.test(s) && s.length >= 7) s = s.slice(0, -3); // «влажност» → «влажн»
    const keys = [s];
    const m = /^(.{2,}[^аеиоуыэюя])[ое]([кцн])$/.exec(s);
    if (m) keys.push(m[1] + m[2]);
    return keys;
  }

  // the Latin keyboard typed in Russian: «gjkbd» → «полив»
  const LAYOUT_EN = 'qwertyuiop[]asdfghjkl;\'zxcvbnm,.`', LAYOUT_RU = 'йцукенгшщзхъфывапролджэячсмитьбюе';
  const fromLayout = s => s.replace(/[a-z[\];',.`]/g, c => LAYOUT_RU[LAYOUT_EN.indexOf(c)]);
  const latinTyped = w => /^[a-z[\];',.`]+$/.test(w);

  // a few words people use for the same thing; «forms» are the forms of one word the stem cannot join
  const SYNONYMS = [
    { forms: true, words: ['тля', 'тли', 'тлю', 'тлей'] },
    { forms: true, words: ['семя', 'семена', 'семян', 'семенам'] },
    { words: ['подкормка', 'удобрение', 'удобрять', 'подкормить', 'подкармливать'] },
    { words: ['лампа', 'досветка', 'фитолампа', 'подсветка', 'светильник'] },
    { words: ['вредители', 'вредитель', 'насекомые'] },
    { words: ['вянет', 'вянут', 'увядание', 'увядает', 'вялые', 'поникли'] },
    { words: ['мошки', 'мушки', 'мошкара', 'сциариды'] },
    { words: ['сушка', 'сушить', 'высушить', 'сушеный'] },
    { words: ['цветет', 'цветение', 'цветонос', 'бутоны', 'соцветие'] },
    { words: ['желтеют', 'желтые', 'пожелтение', 'желтизна', 'хлороз'] },
    { words: ['пересадка', 'пересадить', 'пересаживать'] },
    { words: ['полив', 'поливать', 'полейте'] },
    { words: ['посев', 'сеять', 'посеять'] },
    { words: ['черенки', 'черенкование', 'укоренение', 'укоренить'] },
    { words: ['прищипывание', 'прищипнуть', 'прищипка', 'обрезка', 'формировка'] },
    { words: ['заморозка', 'заморозить', 'морозилка', 'замораживать'] },
    { words: ['гниль', 'гниет', 'гниют', 'загнивание', 'гнилые'] },
    { words: ['плесень', 'налет'] },
    { words: ['рассада', 'сеянцы', 'всходы', 'проростки'] },
    { words: ['кислый', 'кислотность', 'ph'] },
    { words: ['горшок', 'кашпо', 'контейнер', 'емкость'] },
    { words: ['грунт', 'почва', 'субстрат'] }
  ].map(g => Object.assign(g, { keys: [...new Set([].concat(...g.words.map(w => keysOf(norm(w)))))].filter(k => g.forms || k.length >= 4) }));
  const sameKey = (a, b) => a === b || (a.length >= 4 && b.startsWith(a)) || (b.length >= 4 && a.startsWith(b));
  // what a query word may be found as: its own keys (weight 1), its synonyms' keys (weight 0.7)
  function altsOf(w) {
    const own = keysOf(w);
    const alts = own.map(k => ({ k, wt: 1 }));
    SYNONYMS.forEach(g => {
      if (!g.keys.some(gk => own.some(k => sameKey(k, gk)))) return;
      g.keys.forEach(gk => { if (!alts.some(a => a.k === gk)) alts.push({ k: gk, wt: g.forms ? 1 : 0.7 }); });
    });
    return alts;
  }

  // optimal string alignment distance (a swap of two neighbours is one step), given up past max
  function editDistance(a, b, max) {
    const n = b.length;
    let p2 = null, p = Array.from({ length: n + 1 }, (_, j) => j);
    for (let i = 1; i <= a.length; i++) {
      const c = [i];
      let low = i;
      for (let j = 1; j <= n; j++) {
        let v = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, p2[j - 2] + 1);
        c[j] = v;
        if (v < low) low = v;
      }
      if (low > max) return max + 1;
      p2 = p;
      p = c;
    }
    return p[n];
  }
  // the guide's word closest to one it does not have: a letter off, two for long words; the more
  // frequent wins a tie
  function nearestWord(w, vocab) {
    const max = w.length >= 8 ? 2 : w.length >= 4 ? 1 : 0;
    if (!max) return null;
    let best = null, bd = max + 1, bn = 0;
    vocab.forEach((cnt, v) => {
      if (Math.abs(v.length - w.length) > max) return;
      const d = editDistance(w, v, max);
      if (d < bd || (d === bd && cnt > bn)) { best = v; bd = d; bn = cnt; }
    });
    return best;
  }
