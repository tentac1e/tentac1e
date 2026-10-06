#!/usr/bin/env python3
"""Выкладка одной командой: обе сборки, архив для REG.RU и превью.

    python3 scripts/release.py

dist/gid-po-baziliku-regru.zip   содержимое dist/site (вместе со скрытым .htaccess, sw.js, manifest.webmanifest) —
                                 его распаковывают в www/ocimum.ru/ на REG.RU
dist/preview/page.html           главная для превью-страницы: без строк каркаса (их добавляет сам хостинг превью)
dist/preview/*.html              остальные страницы; шрифты — у Google, как у книги одним файлом (своих файлов шрифтов
                                 превью не несёт); старые адреса слитых глав (MOVED) — как есть: они сразу ведут дальше
dist/preview/files.json          опубликованный путь → файл на диске: страницы, стили, скрипты, модели глав
"""
import json
import re
import subprocess
import sys
import zipfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build import GOOGLE_FONTS, MOVED, ROOT  # noqa: E402

DIST = ROOT / 'dist'
SITE = DIST / 'site'
ZIP = DIST / 'gid-po-baziliku-regru.zip'
PREVIEW = DIST / 'preview'
# the lines of the page's frame the preview host writes itself
FRAME = {'<!doctype html>', '<html lang="ru">', '<head>', '<meta charset="utf-8">',
         '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">',
         '</head>', '<body>', '</body>', '</html>'}


def build():
    for args in ([], ['--clean', '--out', str(SITE)]):
        subprocess.run([sys.executable, str(ROOT / 'scripts' / 'build.py'), *args], check=True, stdout=subprocess.DEVNULL)


def pack():
    """the hosting copy as it lies in dist/site, hidden files included"""
    ZIP.unlink(missing_ok=True)
    files = sorted(p for p in SITE.rglob('*') if p.is_file())
    with zipfile.ZipFile(ZIP, 'w', zipfile.ZIP_DEFLATED) as z:
        for p in files:
            z.write(p, p.relative_to(SITE).as_posix())
    return len(files)


def preview():
    """the pages of the build in the root (links like sorta.html) with Google's fonts, and the map of files to publish"""
    if PREVIEW.exists():
        for p in PREVIEW.iterdir():
            p.unlink()
    PREVIEW.mkdir(parents=True, exist_ok=True)
    files = {}
    moved = {m['file'] for m in MOVED.values()}
    for f in sorted(ROOT.glob('*.html')):
        html = f.read_text(encoding='utf-8')
        if f.name in moved:
            (PREVIEW / f.name).write_text(html, encoding='utf-8')
            files[f.name] = str(PREVIEW / f.name)
            continue
        html, n = re.subn(r'<style>\n/\* Шрифты сайта.*?</style>', lambda m: GOOGLE_FONTS, html, count=1, flags=re.S)
        assert n == 1, f'{f.name}: the fonts block is not where it was'
        # the font preloads point at files the preview does not carry
        html = re.sub(r'<link rel="preload" href="assets/fonts/[^"]*" as="font"[^>]*>\n?', '', html)
        if f.name == 'index.html':
            html = '\n'.join(line for line in html.split('\n') if line.strip() not in FRAME)
            (PREVIEW / 'page.html').write_text(html, encoding='utf-8')
        else:
            (PREVIEW / f.name).write_text(html, encoding='utf-8')
            files[f.name] = str(PREVIEW / f.name)
    js = ROOT / 'assets' / 'js'
    for p in sorted((ROOT / 'assets' / 'css').glob('*.css')) + sorted(js.glob('*.js')) + sorted((js / 'labs').glob('*.js')):
        files[p.relative_to(ROOT).as_posix()] = str(p)
    (PREVIEW / 'files.json').write_text(json.dumps(files, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    return files


def main():
    build()
    n = pack()
    files = preview()
    print(f'{ZIP.relative_to(ROOT)}: {n} файлов, {ZIP.stat().st_size // 1024} КБ — распаковать в www/ocimum.ru/')
    print(f'{(PREVIEW / "page.html").relative_to(ROOT)} + {len(files)} файлов в {(PREVIEW / "files.json").relative_to(ROOT)} — превью')


if __name__ == '__main__':
    main()
