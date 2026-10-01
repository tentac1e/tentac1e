#!/usr/bin/env python3
"""Шрифты сайта — свои, с того же хостинга, а не с Google: меньше соединений, кэш на год, предзагрузка.

    python3 scripts/fonts.py    # один раз (или при смене гарнитур): скачивает файлы в src/fonts/

Берёт у Google Fonts те же гарнитуры и начертания, что сайт использовал раньше, со всеми подмножествами
(кириллица, латиница и остальные — браузер скачивает только те, чьи знаки есть на странице), и пишет
src/fonts/<гарнитура>-<начертание>-<подмножество>.woff2 и src/fonts/fonts.css с @font-face.
Сборка (scripts/build.py) копирует файлы в assets/fonts/ и вставляет fonts.css в <head> каждой страницы.
Шрифты под лицензией SIL Open Font License: их можно раздавать со своего сервера.
"""
import re
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


if __name__ == '__main__':
    main()
