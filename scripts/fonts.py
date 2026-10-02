#!/usr/bin/env python3
"""Шрифты сайта — свои, с того же хостинга, а не с Google: меньше соединений, кэш на год, предзагрузка.

    python3 scripts/fonts.py              # один раз (или при смене гарнитур): скачивает файлы в src/fonts/
    python3 scripts/fonts.py --fallbacks  # пересчитать запасные начертания (нужны fontTools и brotli, шрифты Liberation)

Берёт у Google Fonts те же гарнитуры и начертания, что сайт использовал раньше, со всеми подмножествами
(кириллица, латиница и остальные — браузер скачивает только те, чьи знаки есть на странице), и пишет
src/fonts/<гарнитура>-<начертание>-<подмножество>.woff2 и src/fonts/fonts.css с @font-face.
Сборка (scripts/build.py) копирует файлы в assets/fonts/ и вставляет fonts.css в <head> каждой страницы.
Шрифты под лицензией SIL Open Font License: их можно раздавать со своего сервера.

Запасные начертания («Manrope Fallback» и т. п.): пока шрифт сайта не пришёл, текст набран системным шрифтом,
подогнанным под него (size-adjust и высоты строки) — когда шрифт приходит, строки почти не переливаются и вёрстка
не прыгает. Поправки считаются по тексту глав: средняя ширина знака веб-шрифта против системного. Системные
шрифты — Arial, Times New Roman, Courier New; их метрики берутся у шрифтов Liberation, совпадающих с ними.
"""
import re
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'src' / 'fonts'
CSS = ('https://fonts.googleapis.com/css2?family=Caveat:wght@500;600&family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600'
       '&family=JetBrains+Mono:wght@400;500&family=Manrope:wght@400;500;600;700;800&display=swap')
# a current browser: Google answers with woff2 files and unicode-range subsets
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36'


def get(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=60).read()


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    css = get(CSS).decode('utf-8')
    # Google lists every weight separately, all pointing at one variable file: one rule per file with the range
    # of weights (the same faces, a third of the text — it goes into the <head> of every page)
    faces = {}
    for m in re.finditer(r'/\* ([a-z-]+) \*/\s*@font-face \{(.*?)\}', css, re.S):
        subset, body = m.group(1), m.group(2)
        family = re.search(r"font-family: '([^']+)'", body).group(1)
        style = re.search(r'font-style: (\w+)', body).group(1)
        weight = int(re.search(r'font-weight: (\d+)', body).group(1))
        url = re.search(r'url\((https://[^)]+)\)', body).group(1)
        rng = re.search(r'unicode-range: ([^;]+);', body).group(1)
        name = f"{family.lower().replace(' ', '-')}-{style}-{subset}.woff2"
        f = faces.setdefault(name, {'family': family, 'style': style, 'url': url, 'range': rng, 'w': []})
        assert f['url'] == url, name
        f['w'].append(weight)
    out = []
    for name, f in faces.items():
        (OUT / name).write_bytes(get(f['url']))
        w = f"{min(f['w'])} {max(f['w'])}" if len(set(f['w'])) > 1 else str(f['w'][0])
        out.append(f"@font-face{{font-family:'{f['family']}';font-style:{f['style']};font-weight:{w};font-display:swap;"
                   f"src:url(fonts/{name}) format('woff2');unicode-range:{f['range']}}}")
    (OUT / 'fonts.css').write_text('/* Шрифты сайта: файлы в src/fonts/, собирает scripts/fonts.py */\n' + '\n'.join(out) + '\n', encoding='utf-8')
    total = sum((OUT / n).stat().st_size for n in faces)
    print(f'{len(faces)} файлов, {total // 1024} КБ в src/fonts/')
    fallbacks()


# family, style → the system fonts it waits on (in order of preference) and the Liberation file with their metrics
FALLBACK = [
    ('Manrope', 'normal', ['Arial', 'Helvetica', 'Liberation Sans', 'Roboto'], 'LiberationSans-Regular.ttf'),
    ('Cormorant Garamond', 'normal', ['Times New Roman', 'Times', 'Liberation Serif', 'Noto Serif'], 'LiberationSerif-Regular.ttf'),
    ('Cormorant Garamond', 'italic', ['Times New Roman Italic', 'Times-Italic', 'Liberation Serif Italic', 'Noto Serif Italic'], 'LiberationSerif-Italic.ttf'),
    ('JetBrains Mono', 'normal', ['Courier New', 'Courier', 'Liberation Mono', 'Roboto Mono'], 'LiberationMono-Regular.ttf'),
    ('Caveat', 'normal', ['Arial', 'Helvetica', 'Liberation Sans', 'Roboto'], 'LiberationSans-Regular.ttf'),
]
LIBERATION = Path('/usr/share/fonts/truetype/liberation')
MARK = '/* запасные начертания: scripts/fonts.py --fallbacks */'


def sample():
    """the text of the chapters, as the reader sees it: the widths are averaged over its letters"""
    text = ' '.join(f.read_text(encoding='utf-8') for f in sorted((ROOT / 'src' / 'pages').rglob('*.html')))
    text = re.sub(r'<(script|style)[^>]*>.*?</\1>', ' ', text, flags=re.S)
    text = re.sub(r'<[^>]+>|&[a-z]+;', ' ', text)
    return re.sub(r'\s+', ' ', text)


def fallbacks():
    try:
        from fontTools.ttLib import TTFont
    except ImportError:
        print('fontTools не установлен: запасные начертания не пересчитаны (pip install fonttools brotli)')
        return
    text = sample()
    freq = {}
    for ch in text:
        freq[ch] = freq.get(ch, 0) + 1

    def metrics(files):
        fonts = [TTFont(f) for f in files]
        upm = fonts[0]['head'].unitsPerEm
        hh = fonts[0]['hhea']
        maps = [(f.getBestCmap(), f['hmtx']) for f in fonts]
        total = n = 0
        for ch, k in freq.items():
            for cmap, hmtx in maps:
                g = cmap.get(ord(ch))
                if g:
                    total += hmtx[g][0] / upm * k
                    n += k
                    break
        return {'avg': total / n, 'asc': hh.ascent / upm, 'desc': -hh.descent / upm, 'gap': hh.lineGap / upm}

    rules = [MARK]
    for family, style, local, lib in FALLBACK:
        slug = f"{family.lower().replace(' ', '-')}-{style}"
        web = metrics([OUT / f'{slug}-{s}.woff2' for s in ('cyrillic', 'latin') if (OUT / f'{slug}-{s}.woff2').exists()])
        sys_ = metrics([LIBERATION / lib])
        k = web['avg'] / sys_['avg']
        pct = lambda v: f'{v * 100:.2f}%'
        rules.append(f"@font-face{{font-family:'{family} Fallback';font-style:{style};src:{', '.join(f'local({chr(39)}{n}{chr(39)})' for n in local)};"
                     f"size-adjust:{pct(k)};ascent-override:{pct(web['asc'] / k)};descent-override:{pct(web['desc'] / k)};line-gap-override:{pct(web['gap'] / k)}}}")
        print(f'{family} {style}: size-adjust {k * 100:.1f}%')
    css = (OUT / 'fonts.css').read_text(encoding='utf-8').split(MARK)[0].rstrip('\n') + '\n'
    (OUT / 'fonts.css').write_text(css + '\n'.join(rules) + '\n', encoding='utf-8')


if __name__ == '__main__':
    fallbacks() if '--fallbacks' in sys.argv else main()
