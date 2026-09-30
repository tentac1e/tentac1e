#!/usr/bin/env python3
"""Локальный сервер для проверки версии для хостинга — с теми же адресами, что даёт .htaccess на REG.RU.

    python3 scripts/build.py --clean --out dist/site
    python3 scripts/serve.py                     # http://127.0.0.1:8790/  (папка dist/site)
    python3 scripts/serve.py --port 8000 --dir dist/site

Правила те же, что в сгенерированном .htaccess:
    /урожай                    → urozhay.html (адрес не меняется)
    /urozhay, /urozhay.html    → 301 на /урожай
    /index.html                → 301 на /
    /что-то.html               → 301 без .html
"""
import argparse
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import quote, unquote, urlsplit

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build import FILE, SLUG  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
BY_SLUG = {slug: FILE[view] for view, slug in SLUG.items() if slug}


class Handler(SimpleHTTPRequestHandler):
    def log_message(self, fmt, *args):
        if self.server.verbose:
            super().log_message(fmt, *args)

    def handle(self):
        # the browser dropped the connection (a test moved on) — not an error worth a traceback
        try:
            super().handle()
        except (BrokenPipeError, ConnectionResetError):
            pass

    def redirect(self, to):
        self.send_response(301)
        self.send_header('Location', to)
        self.end_headers()

    def route(self):
        parts = urlsplit(self.path)
        path = unquote(parts.path)
        query = ('?' + parts.query) if parts.query else ''
        name = path.strip('/')
        if path in ('/index', '/index.html'):
            return self.redirect('/' + query)
        stem = name[:-5] if name.endswith('.html') else name
        if stem in SLUG and stem != 'glavnaya':
            return self.redirect('/' + quote(SLUG[stem]) + query)
        if name.endswith('.html'):
            return self.redirect('/' + quote(stem) + query)
        if path.endswith('/') and path != '/':
            return self.redirect(quote(path.rstrip('/')) + query)
        if name in BY_SLUG:
            self.path = '/' + BY_SLUG[name] + query
        return None

    def do_GET(self):
        if self.route() is None:
            super().do_GET()

    def do_HEAD(self):
        if self.route() is None:
            super().do_HEAD()

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--port', type=int, default=8790)
    ap.add_argument('--dir', default=str(ROOT / 'dist' / 'site'))
    ap.add_argument('-v', '--verbose', action='store_true')
    a = ap.parse_args()
    d = Path(a.dir).resolve()
    if not (d / 'index.html').exists():
        sys.exit(f'{d} — нет index.html. Сначала: python3 scripts/build.py --clean --out dist/site')
    Handler.extensions_map = {**SimpleHTTPRequestHandler.extensions_map, '.js': 'text/javascript; charset=utf-8',
                              '.css': 'text/css; charset=utf-8', '.html': 'text/html; charset=utf-8'}
    srv = ThreadingHTTPServer(('127.0.0.1', a.port), partial(Handler, directory=str(d)))
    srv.verbose = a.verbose
    print(f'http://127.0.0.1:{a.port}/  ← {d}', flush=True)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == '__main__':
    main()
