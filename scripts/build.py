#!/usr/bin/env python3
"""Сборка сайта из исходников в src/.

    python3 scripts/build.py                 # 12 страниц в корне репозитория
    python3 scripts/build.py --single PATH   # вся книга одним HTML-файлом (все главы на одной странице)

Исходники:
    src/layout.html        общий каркас: шапка, спрайт, фон, подвал, поиск, меню
    src/pages/<глава>.html  содержимое одной главы (<section data-view="…">)

Что делает сборка:
    • кладёт каждую главу в каркас и пишет index.html, sorta.html, …;
    • переписывает ссылки «#id» на другие главы в «страница.html#id»;
    • ставит постоянные id заголовкам, на которые ведёт поиск;
    • пишет assets/js/pages.js — карту «id → страница» и счётчики для главной;
    • пишет assets/js/search-index.js — поисковый индекс по тексту всех глав
      (страница подгружает его, только когда открывают поиск).
Ничего не сжимается и не минифицируется: сгенерированные файлы остаются читаемыми.
"""
import json
import re
import sys
from html import escape
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'src'

PAGES = [
    ('glavnaya', 'index.html'),
    ('sorta', 'sorta.html'),
    ('posadka', 'posadka.html'),
    ('kalendar', 'kalendar.html'),
    ('uhod', 'uhod.html'),
    ('udobreniya', 'udobreniya.html'),
    ('formirovka', 'formirovka.html'),
    ('urozhay', 'urozhay.html'),
    ('vkus', 'vkus.html'),
    ('razmnozhenie', 'razmnozhenie.html'),
    ('problemy', 'problemy.html'),
    ('spravka', 'spravka.html'),
]
FILE = dict(PAGES)
# ids that scripts create at run time, by prefix
PREFIXES = {'dis-': 'problemy', 'pest-': 'problemy', 'g-': 'spravka', 'ck-': 'spravka', 'r-': 'urozhay'}
SCRIPTS = ['data.js', 'pages.js', 'scene.js', 'science.js', 'app.js']

SITE_TITLE = 'Гид по базилику'
SITE_DESC = ('Подробный гид по выращиванию базилика в 11 главах: сорта, посадка, уход, удобрения по стадиям роста, '
             'прищипывание, урожай, химия вкуса и аромата, размножение, болезни. С калькуляторами, научными разворотами '
             'и интерактивными моделями.')

# search: the same rules the page used when it indexed itself
SKIP = ['#chapters', '#quick', '#tools-home', '#journey', '.diag-result', '.el-detail', '#variety-detail', '.quiz',
        '.plan-list', '.timeline', '.dose-out', '.npk-out', '.soil-out', '.dli-out', '.stage-body', '.pager', '.sim',
        '#glossary', '#disease-grid', '#pest-grid', '#diag-groups', '#place-panel', '#check-groups', '.lab-tool',
        '.deep-index', '.recipe-book', '.deep-src']
BOX = ['details', '.card', '.step', '.pane', 'article', '.rule', 'li']
VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr'}


# ---------------------------------------------------------------- mini DOM
class Node:
    __slots__ = ('tag', 'attrs', 'children', 'parent', 'pos', 'text')

    def __init__(self, tag, attrs=None, parent=None, pos=0, text=None):
        self.tag, self.attrs, self.parent, self.pos, self.text = tag, attrs or {}, parent, pos, text
        self.children = []

    @property
    def classes(self):
        return self.attrs.get('class', '').split()

    def matches(self, sel):
        if sel.startswith('#'):
            return self.attrs.get('id') == sel[1:]
        if sel.startswith('.'):
            return sel[1:] in self.classes
        if sel.startswith('['):
            return sel[1:-1] in self.attrs
        return self.tag == sel

    def closest(self, sels):
        n = self
        while n is not None and n.tag != '#root':
            if n.tag != '#text' and any(n.matches(s) for s in sels):
                return n
            n = n.parent
        return None

    def iter(self):
        for c in self.children:
            yield c
            if c.tag != '#text':
                yield from c.iter()

    def find(self, sel):
        return next((n for n in self.iter() if n.tag != '#text' and n.matches(sel)), None)

    def next_element(self):
        sib = [c for c in self.parent.children if c.tag != '#text']
        i = sib.index(self)
        return sib[i + 1] if i + 1 < len(sib) else None


class Builder(HTMLParser):
    def __init__(self, src):
        super().__init__(convert_charrefs=True)
        self.lines = [0]
        for line in src.split('\n'):
            self.lines.append(self.lines[-1] + len(line) + 1)
        self.root = self.cur = Node('#root')
        self.feed(src)
        self.close()

    def _pos(self):
        line, col = self.getpos()
        return self.lines[line - 1] + col

    def handle_starttag(self, tag, attrs):
        n = Node(tag, {k: (v or '') for k, v in attrs}, self.cur, self._pos())
        self.cur.children.append(n)
        if tag not in VOID:
            self.cur = n

    def handle_startendtag(self, tag, attrs):
        self.cur.children.append(Node(tag, {k: (v or '') for k, v in attrs}, self.cur, self._pos()))

    def handle_endtag(self, tag):
        n = self.cur
        while n is not None and n.tag != tag:
            n = n.parent
        if n is not None and n.parent is not None:
            self.cur = n.parent

    def handle_data(self, data):
        self.cur.children.append(Node('#text', parent=self.cur, text=data))


def text_of(node):
    if node is None:
        return ''
    parts = [n.text for n in node.iter() if n.tag == '#text'] if node.tag != '#text' else [node.text]
    s = re.sub(r'\s+', ' ', ' '.join(parts))
    return re.sub(r'\s([.,;:!?)»])', r'\1', s).strip()


# ---------------------------------------------------------------- helpers
def chapters():
    data = (ROOT / 'assets/js/data.js').read_text(encoding='utf-8')
    out = {}
    for m in re.finditer(r"\{ id: '([a-z]+)', num: (\d+), title: '([^']+)', art: '[^']+', desc: '([^']+)' \}", data):
        out[m.group(1)] = {'num': int(m.group(2)), 'title': m.group(3), 'desc': m.group(4)}
    return out


def attr(s):
    return escape(s, quote=True)


def main():
    single = None
    if '--single' in sys.argv:
        single = Path(sys.argv[sys.argv.index('--single') + 1]).resolve()

    layout = (SRC / 'layout.html').read_text(encoding='utf-8')
    src = {v: (SRC / 'pages' / f'{v}.html').read_text(encoding='utf-8') for v, _ in PAGES}
    CH = chapters()

    # 1. give every searchable heading a stable id, and index the text
    static_entries_panels, static_entries_heads = [], []
    stats = {'kinds': {}, 'labs': 0, 'deeper': 0, 'deep': 0}
    titles = {}  # captions for links that lead to another page
    for view, _ in PAGES:
        html = src[view]
        dom = Builder(html).root
        ch = CH.get(view)
        inserts = []
        n = 0
        for node in dom.iter():
            if node.tag == '#text':
                continue
            if node.tag == 'details' and 'deep' in node.classes and node.attrs.get('id'):
                titles[node.attrs['id']] = 'Глубже: ' + node.attrs.get('data-short', '')
            if node.matches('[data-panel]') and ch:
                titles[node.attrs['id']] = f"{ch['title']} · {node.attrs.get('data-title', '')}"
            if node.matches('[data-panel]'):
                static_entries_panels.append({'title': node.attrs.get('data-title', ''), 'sub': ch['title'] if ch else '',
                                              'text': text_of(node)[:400], 'page': view, 'hash': node.attrs['id'], 'icon': 'list'})
            if node.matches('.lab-tool') and 'data-lab' in node.attrs:
                stats['labs'] += 1
            if node.tag == 'details' and 'deep' in node.classes:
                stats['deep'] += 1
                k = node.attrs.get('data-kind', '')
                stats['kinds'][k] = stats['kinds'].get(k, 0) + 1
            if node.tag == 'details' and 'deeper' in node.classes:
                stats['deeper'] += 1
            if node.tag not in ('h3', 'h4', 'summary') or node.closest(SKIP):
                continue
            panel = node.closest(['[data-panel]'])
            where = (ch['title'] if ch else 'Главная') + (' · ' + panel.attrs['data-title'] if panel is not None and panel.attrs.get('data-title') else '')
            parent = node.parent
            if node.tag == 'summary' and 'deeper' in parent.classes:
                host = node.closest(['.deep'])
                hid = node.attrs.get('id') or (host.attrs['id'] + '-glubzhe' if host is not None else f'{view}-h{n + 1}')
                if 'id' not in node.attrs:
                    inserts.append((node.pos, hid))
                t = node.find('.deeper-t')
                static_entries_heads.append({'title': text_of(t), 'sub': 'Ещё глубже · ' + (host.attrs.get('data-short') if host is not None else where),
                                             'text': text_of(node.next_element())[:420], 'page': view, 'hash': hid, 'icon': 'hex'})
                continue
            if node.tag == 'summary' and 'deep' in parent.classes:
                static_entries_heads.append({'title': text_of(node.find('.deep-title')), 'sub': 'Глубже · ' + where,
                                             'text': (text_of(node.find('.deep-sub')) + ' ' + text_of(parent.find('.deep-body')))[:420],
                                             'page': view, 'hash': parent.attrs['id'], 'icon': 'hex'})
                continue
            hid = node.attrs.get('id')
            if not hid:
                n += 1
                hid = f'{view}-h{n}'
                inserts.append((node.pos, hid))
            box = node.closest(BOX) or node.parent
            static_entries_heads.append({'title': text_of(node), 'sub': where + (' · Глубже' if node.closest(['.deep']) else ''),
                                         'text': text_of(box)[:360], 'page': view, 'hash': hid,
                                         'icon': 'info' if node.tag == 'summary' else 'leaf'})
        for pos, hid in sorted(inserts, reverse=True):
            m = re.match(r'<[a-z0-9]+', html[pos:])
            assert m, (view, html[pos:pos + 40])
            cut = pos + m.end()
            html = html[:cut] + f' id="{hid}"' + html[cut:]
        src[view] = html

    # 2. which page owns which id
    owner = {}
    for view, _ in PAGES:
        for m in re.finditer(r'\sid="([^"]+)"', src[view]):
            owner.setdefault(m.group(1), view)
        owner[view] = view

    def href_for(target, here):
        if single:
            return '#' + target
        if target in FILE:
            if target == here:
                return '#' + target
            return FILE[target]
        page = owner.get(target) or next((p for pre, p in PREFIXES.items() if target.startswith(pre)), None)
        if not page or page == here:
            return '#' + target
        return f'{FILE[page]}#{target}'

    def rewrite_links(html, here):
        def fix(m):
            target = m.group(2)
            if target in ('main', 'top'):
                return m.group(0)
            return f'{m.group(1)}href="{href_for(target, here)}"'
        return re.sub(r'(<a\b[^>]*?\s)href="#([^"]+)"', fix, html)

    # 3. generated data files
    js = ROOT / 'assets' / 'js'
    pages_js = {
        'files': FILE,
        'prefixes': PREFIXES,
        'ids': {k: v for k, v in sorted(owner.items()) if not k.startswith('lab-')},
        'stats': stats,
        'titles': titles,
    }
    (js / 'pages.js').write_text(
        '/* Гид по базилику — карта страниц. Файл создаёт scripts/build.py, правьте src/ */\n'
        'window.BASIL_PAGES = ' + json.dumps(pages_js, ensure_ascii=False, indent=1) + ';\n', encoding='utf-8')
    (js / 'search-index.js').write_text(
        '/* Гид по базилику — поисковый индекс по тексту глав. Файл создаёт scripts/build.py */\n'
        'window.BASIL_SEARCH = ' + json.dumps(static_entries_panels + static_entries_heads, ensure_ascii=False, indent=0) + ';\n',
        encoding='utf-8')

    # 4. pages
    def page_html(views, here):
        content = '\n'.join(src[v] for v in views)
        if not single:
            content = content.replace('<section class="view', '<section class="view is-active', 1)
            # first panel is visible straight from the HTML, before any script runs
            content = re.sub(r'(<div class="panel)(" data-panel)', r'\1 is-active\2', content, count=1)
        ch = CH.get(here)
        title = f"{ch['title']} — {SITE_TITLE}" if ch and not single else SITE_TITLE
        desc = f"{ch['desc']} Глава {ch['num']} гида по выращиванию базилика." if ch and not single else SITE_DESC
        out = layout.replace('{{content}}', content)
        out = out.replace('{{title}}', escape(title)).replace('{{description}}', attr(desc))
        out = rewrite_links(out, here)
        # header: mark the current chapter
        if not single:
            out = out.replace(f'data-nav="{here}"', f'data-nav="{here}" aria-current="page" class="is-active"')
        scripts = '\n'.join(f'<script src="assets/js/{s}" defer></script>' for s in SCRIPTS if not (single and s == 'pages.js'))
        if single:
            scripts = scripts.replace('<script src="assets/js/science.js" defer></script>',
                                      '<script src="assets/js/science.js" defer></script>\n<script src="assets/js/labs.js" defer></script>')
        out = out.replace('{{scripts}}', scripts)
        return out

    if single:
        html = page_html([v for v, _ in PAGES], 'glavnaya')
        tmp = ROOT / '.single.html'
        tmp.write_text(html, encoding='utf-8')
        import subprocess
        subprocess.run([sys.executable, str(ROOT / 'scripts' / 'bundle.py'), str(single), '--from', str(tmp)], check=True)
        tmp.unlink()
        return

    for view, file in PAGES:
        (ROOT / file).write_text(page_html([view], view), encoding='utf-8')
        print(f'{file:18} {len((ROOT / file).read_bytes()) // 1024:4} КБ')
    print(f'pages.js {len((js / "pages.js").read_bytes()) // 1024} КБ, search-index.js {len((js / "search-index.js").read_bytes()) // 1024} КБ, '
          f'{len(static_entries_panels) + len(static_entries_heads)} записей в индексе')


if __name__ == '__main__':
    main()
