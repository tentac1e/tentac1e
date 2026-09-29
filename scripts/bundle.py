#!/usr/bin/env python3
"""Собирает сайт в один HTML-файл: стили и скрипты встраиваются в страницу.

    python3 scripts/bundle.py                     # dist/gid-po-baziliku.html
    python3 scripts/bundle.py out.html --fragment  # без <!doctype>/<html>/<head>/<body>
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent


def main() -> None:
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    fragment = '--fragment' in sys.argv
    out = pathlib.Path(args[0]) if args else ROOT / 'dist' / 'gid-po-baziliku.html'

    html = (ROOT / 'index.html').read_text(encoding='utf-8')

    def inline_css(match: re.Match) -> str:
        css = (ROOT / match.group(1)).read_text(encoding='utf-8')
        return f'<style>\n{css}\n</style>'

    def inline_js(match: re.Match) -> str:
        js = (ROOT / match.group(1)).read_text(encoding='utf-8')
        return f'<script>\n{js}\n</script>'

    html = re.sub(r'<link rel="stylesheet" href="(assets/[^"]+\.css)">', inline_css, html)
    html = re.sub(r'<script src="(assets/[^"]+\.js)" defer></script>', inline_js, html)

    if fragment:
        for pattern in (r'<!doctype html>\s*', r'<html[^>]*>\s*', r'</html>\s*', r'<head>\s*', r'</head>\s*',
                        r'<body>\s*', r'</body>\s*', r'<meta charset="utf-8">\s*', r'<meta name="viewport"[^>]*>\s*'):
            html = re.sub(pattern, '', html, count=1, flags=re.I)

    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html, encoding='utf-8')
    print(f'{out} — {len(html.encode("utf-8")) // 1024} КБ')


if __name__ == '__main__':
    main()
