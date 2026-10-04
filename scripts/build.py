#!/usr/bin/env python3
"""Сборка сайта из исходников в src/.

    python3 scripts/build.py                           # 12 страниц в корне репозитория (ссылки вида sorta.html)
    python3 scripts/build.py --clean --out dist/site   # версия для хостинга: адреса вида /урожай + .htaccess
    python3 scripts/build.py --single PATH             # вся книга одним HTML-файлом (все главы на одной странице)

Исходники (всё, что правится руками, лежит в src/; assets/ целиком собирается из них):
    src/layout.html                 общий каркас: шапка, спрайт, фон, подвал, поиск, меню
    src/pages/<глава>/              глава по кускам: _head.html (обложка и вкладки), 1-<вкладка>.html …, _foot.html
    src/pages/<глава>.html          глава без вкладок (главная, календарь) — одним файлом
    src/js/<модуль>/_frame.js + NN-*.js   → assets/js/<модуль>.js (app, science, scene, data)
    src/js/haptics.js               → assets/js/haptics.js как есть
    src/css/style/NN-*.css          → assets/css/style.css
    src/css/lab/NN-*.css            → assets/css/lab.css; на месте /*@labs*/ — стили моделей
    src/labs/_frame.js              общие помощники моделей
    src/labs/<глава>/<модель>.js    одна модель (register('имя', …)); рядом <модель>.css и, если надо, _shared.js
                                    → assets/js/labs/<глава>.js: страница грузит модели только своей главы

Что делает сборка:
    • склеивает скрипты и стили из src/ в assets/ (порядок — по номеру в имени файла);
    • кладёт каждую главу в каркас и пишет index.html, sorta.html, …;
    • переписывает ссылки «#id» на другие главы в «страница.html#id»;
    • ставит постоянные id заголовкам, на которые ведёт поиск;
    • пишет assets/js/pages.js — карту «id → страница» и счётчики для главной;
    • пишет assets/js/search-index.js — поисковый индекс по тексту всех глав
      (страница подгружает его, только когда открывают поиск).
Ничего не сжимается и не минифицируется: сгенерированные файлы остаются читаемыми.
"""
import hashlib
import json
import re
import shutil
import sys
import tempfile
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
    ('moy', 'moy.html'),
]
FILE = dict(PAGES)
# addresses on the hosting: ocimum.ru/урожай. Files stay Latin (urozhay.html) — safe for any file manager
SLUG = {'glavnaya': '', 'sorta': 'сорта', 'posadka': 'посадка', 'kalendar': 'календарь', 'uhod': 'уход',
        'udobreniya': 'удобрения', 'formirovka': 'прищипывание', 'urozhay': 'урожай', 'vkus': 'вкус',
        'razmnozhenie': 'размножение', 'problemy': 'проблемы', 'spravka': 'справка', 'moy': 'мой-базилик'}
# a page that is not a numbered chapter: its title and description for the <head>, the search and the map
PAGE_META = {'moy': {'num': None, 'title': 'Мой базилик',
                     'desc': 'Ваши кусты и их дела на неделю, погода глазами листа и домашние опыты о том, как живёт растение.'}}

# short Russian anchors for chapter tabs: /удобрения#план instead of #udobreniya-plan.
# Sources, data and old bookmarks keep the long ids — the build and the router translate them.
TAB = {
    'sorta-katalog': 'каталог', 'sorta-podbor': 'подбор', 'sorta-vybor': 'выбор',
    'posadka-mesto': 'место', 'posadka-posev': 'посев', 'posadka-magazin': 'магазин', 'posadka-gorshok': 'горшок',
    'uhod-svet': 'свет', 'uhod-poliv': 'полив', 'uhod-teplo': 'тепло', 'uhod-pochva': 'почва', 'uhod-sezony': 'сезоны',
    'udobreniya-osnovy': 'основы', 'udobreniya-elementy': 'элементы', 'udobreniya-stadii': 'стадии', 'udobreniya-plan': 'план',
    'udobreniya-sredstva': 'средства', 'udobreniya-kalkulyator': 'калькулятор', 'udobreniya-gidro': 'гидропоника', 'udobreniya-mify': 'мифы',
    'formirovka-osnovy': 'основы', 'formirovka-trenazher': 'тренажер', 'formirovka-cvetenie': 'цветение',
    'urozhay-sbor': 'сбор', 'urozhay-hranenie': 'хранение', 'urozhay-recepty': 'рецепты',
    'vkus-aromat': 'аромат', 'vkus-molekuly': 'молекулы', 'vkus-himotipy': 'химотипы', 'vkus-kuhnya': 'кухня', 'vkus-sochetaniya': 'сочетания',
    'razmnozhenie-cherenki': 'черенки', 'razmnozhenie-semena': 'семена',
    'problemy-diagnostika': 'диагностика', 'problemy-bolezni': 'болезни', 'problemy-vrediteli': 'вредители', 'problemy-profilaktika': 'профилактика',
    'spravka-voprosy': 'вопросы', 'spravka-slovar': 'словарь', 'spravka-chek-list': 'чек-лист',
    'moy-kusty': 'кусты', 'moy-pogoda': 'погода', 'moy-opyty': 'опыты',
}


def htaccess():
    """Apache rules for the --clean build. Only ASCII inside: Cyrillic is written as UTF-8 byte escapes,
    so no hosting editor can re-encode the file."""
    esc = lambda word: ''.join(f'\\x{b:02x}' for b in word.encode('utf-8'))
    # «\%» is a literal percent sign for mod_rewrite (a bare %8 would be a back-reference)
    pct = lambda word: ''.join(f'\\%{b:02X}' for b in word.encode('utf-8'))
    lines = [
        '# Basil guide: Russian addresses without ".html" (Apache). Generated by scripts/build.py --clean.',
        '#   /<chapter in Russian>        -> serves <chapter>.html',
        '#   /<chapter>, /<chapter>.html  -> 301 to the Russian address (old links keep working)',
        '#   /index.html                  -> 301 to /',
        '# Cyrillic is written as \\xNN UTF-8 bytes on purpose: ASCII only, nothing to re-encode.',
        '',
        'AddDefaultCharset UTF-8',
        'AddCharset UTF-8 .html .css .js',
        'AddType font/woff2 .woff2',
        'AddType application/manifest+json .webmanifest',
        '',
        '# compressed transfer: the pages, styles, scripts and the search index shrink four- to fivefold',
        '# (Apache 2.4 takes AddOutputFilterByType from mod_filter: without it the line is skipped, not an error)',
        '<IfModule mod_deflate.c>',
        '<IfModule mod_filter.c>',
        '  AddOutputFilterByType DEFLATE text/html text/css text/javascript application/javascript application/x-javascript application/manifest+json',
        '</IfModule>',
        '</IfModule>',
        '# every style, script and font address carries a fingerprint of its content (?v=...): kept for a year',
        '<IfModule mod_expires.c>',
        '  ExpiresActive On',
        '  ExpiresByType text/css "access plus 1 year"',
        '  ExpiresByType text/javascript "access plus 1 year"',
        '  ExpiresByType application/javascript "access plus 1 year"',
        '  ExpiresByType font/woff2 "access plus 1 year"',
        '  ExpiresByType image/png "access plus 1 year"',
        '  # a page has no fingerprint: the browser checks it on every visit (an unchanged one comes back as 304)',
        '  ExpiresByType text/html "access plus 0 seconds"',
        '  # the offline worker and the app card have no fingerprint: the browser asks for news on every visit',
        '  <FilesMatch "^(sw\\.js|manifest\\.webmanifest)$">',
        '    ExpiresActive Off',
        '  </FilesMatch>',
        '</IfModule>',
        '<IfModule mod_headers.c>',
        '  <FilesMatch "^(sw\\.js|manifest\\.webmanifest)$">',
        '    Header set Cache-Control "no-cache"',
        '  </FilesMatch>',
        '  <FilesMatch "\\.html$">',
        '    Header set Cache-Control "no-cache"',
        '  </FilesMatch>',
        '</IfModule>',
        '# a file with a fingerprint never changes: not even a reload asks about it again (Apache 2.4: <If>)',
        '<IfModule mod_headers.c>',
        '<IfModule mod_version.c>',
        '<IfVersion >= 2.4>',
        '  <If "%{QUERY_STRING} =~ /(^|&)v=/">',
        '    Header set Cache-Control "public, max-age=31536000, immutable"',
        '  </If>',
        '</IfVersion>',
        '</IfModule>',
        '</IfModule>',
        '',
        'RewriteEngine On',
        'RewriteBase /',
        '',
        '# second pass after an internal rewrite below: leave it alone (no redirect loops)',
        'RewriteCond %{ENV:REDIRECT_STATUS} !^$',
        'RewriteRule ^ - [L]',
        '',
        '# /index.html, /index -> /',
        'RewriteCond %{THE_REQUEST} \\s/+(.*?/)?index(\\.html)?[\\s?] [NC]',
        'RewriteRule ^ /%1 [R=301,L,NE]',
        '',
        '# old Latin addresses -> Russian ones',
    ]
    for view, file in PAGES:
        if view == 'glavnaya':
            continue
        lines.append(f'RewriteRule ^{view}(\\.html)?/?$ /{pct(SLUG[view])} [R=301,L,NE]')
    lines += ['', '# any other .html -> without it',
              'RewriteCond %{THE_REQUEST} \\s/+([^?\\s]+?)\\.html[\\s?] [NC]',
              'RewriteRule ^ /%1 [R=301,L,NE]', '',
              '# trailing slash -> without it (relative paths to assets need that)',
              'RewriteCond %{REQUEST_FILENAME} !-d',
              'RewriteRule ^(.+)/$ $1 [R=301,L]', '',
              '# Russian address -> the file, the address bar does not change']
    for view, file in PAGES:
        if view == 'glavnaya':
            continue
        lines += [f'# {view}', f'RewriteRule ^{esc(SLUG[view])}$ {file} [L]']
    return '\n'.join(lines) + '\n'
# ids that scripts create at run time, by prefix
PREFIXES = {'dis-': 'problemy', 'pest-': 'problemy', 'g-': 'spravka', 'ck-': 'spravka', 'r-': 'urozhay'}
SCRIPTS = ['haptics.js', 'data.js', 'pages.js', 'scene.js', 'science.js', 'app.js']

# the one-file book has no assets folder: it keeps loading its fonts from Google, as the site did before
GOOGLE_FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Caveat:wght@500;600&family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600&family=JetBrains+Mono:wght@400;500&family=Manrope:wght@400;500;600;700;800&display=swap">\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Caveat:wght@500;600&family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600&family=JetBrains+Mono:wght@400;500&family=Manrope:wght@400;500;600;700;800&display=swap" media="print" onload="this.media=\'all\'">\n<noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Caveat:wght@500;600&family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600&family=JetBrains+Mono:wght@400;500&family=Manrope:wght@400;500;600;700;800&display=swap"></noscript>'
# asked for at once, before the stylesheet finds them: the text font is on every line of every page
PRELOAD_FONTS = ['manrope-normal-cyrillic.woff2', 'manrope-normal-latin.woff2',
                 # the headings' face, on every page's first screen (the latin part holds the space and the digits)
                 'cormorant-garamond-normal-cyrillic.woff2', 'cormorant-garamond-normal-latin.woff2']

SITE_TITLE = 'Гид по базилику'
APP_SHORT = 'Базилик'  # the name under the icon on a phone's home screen
SITE_DESC = ('Подробный гид по выращиванию базилика в 11 главах: сорта, посадка, уход, удобрения по стадиям роста, '
             'прищипывание, урожай, химия вкуса и аромата, размножение, болезни. С калькуляторами, научными разворотами '
             'и интерактивными моделями.')

# search: the same rules the page used when it indexed itself
SKIP = ['#chapters', '#quick', '#tools-home', '#journey', '.diag-result', '.el-detail', '#variety-detail', '.quiz',
        '.plan-list', '.timeline', '.dose-out', '.npk-out', '.soil-out', '.dli-out', '.stage-body', '.pager', '.sim',
        '#glossary', '#disease-grid', '#pest-grid', '#diag-groups', '#place-panel', '#check-groups', '.lab-tool',
        '.deep-index', '.recipe-book', '.deep-src', '.faq-here']
BOX = ['details', '.card', '.step', '.pane', 'article', '.rule', 'li']
VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr'}


def faq_here(src):
    """«Частые вопросы» where their topic is: each question of Справка marked data-for="<tab>" stands once more at
    the end of that tab's practical part, before its «Глубже», and opens in place. The search keeps the one in
    Справка (.faq-here is in SKIP); the copy has no id of its own"""
    by_tab = {}
    for m in re.finditer(r'<details data-for="([^"]+)">(.*?</details>)', src['spravka'], re.S):
        by_tab.setdefault(m.group(1), []).append('<details>' + m.group(2))
    for tab, items in by_tab.items():
        view = tab.split('-')[0]
        html = src[view]
        start = html.index(f'data-panel id="{tab}"')
        nxt = html.find('data-panel id="', start + 1)
        zone = html.find('<div class="deep-zone">', start)
        assert zone > 0 and (nxt < 0 or zone < nxt), f'{tab}: no «Глубже» to put the questions before'
        block = ('<section class="faq-here">\n        <h3>Частые вопросы</h3>\n        <div class="faq">\n'
                 + ''.join(f'          {d}\n' for d in items)
                 + '        </div>\n        <p class="faq-more"><a href="#spravka-voprosy">Все частые вопросы</a></p>\n'
                 '      </section>\n      ')
        src[view] = html[:zone] + block + html[zone:]


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


HEADS = ('h3', 'h4', 'summary')


def section_of(head):
    """what a heading titles: its box (a card, a step, a details…) when it is the box's first heading,
    otherwise itself and the siblings after it up to the next heading"""
    box = head.closest(BOX)
    if box is not None and next((n for n in box.iter() if n.tag in HEADS), None) is head:
        return [box]
    sib = [c for c in head.parent.children if c.tag != '#text' or c.text.strip()]
    out = [head]
    for c in sib[sib.index(head) + 1:]:
        if c.tag in HEADS or (c.tag != '#text' and any(x.tag in HEADS for x in c.iter())):
            break
        out.append(c)
    return out


def text_own(node, skip):
    """the text of a node without the blocks in skip (ids of nodes that are indexed on their own) and without the
    copies of Справка's questions (faq_here): each piece of text is found once, where it was written"""
    parts = [node.text] if node.tag == '#text' else []

    def walk(n):
        for c in n.children:
            if id(c) in skip or (c.tag != '#text' and c.matches('.faq-here')):
                continue
            if c.tag == '#text':
                parts.append(c.text)
            else:
                walk(c)
    walk(node)
    s = re.sub(r'\s+', ' ', ' '.join(parts))
    return re.sub(r'\s([.,;:!?)»])', r'\1', s).strip()


# ---------------------------------------------------------------- helpers
def chapters():
    data = (SRC / 'js' / 'data' / '00-nav.js').read_text(encoding='utf-8')
    out = {}
    for m in re.finditer(r"\{ id: '([a-z]+)', num: (\d+), title: '([^']+)',[^{}]*? desc: '([^']+)' \}", data):
        out[m.group(1)] = {'num': int(m.group(2)), 'title': m.group(3), 'desc': m.group(4)}
    out.update(PAGE_META)
    return out


# ---------------------------------------------------------------- the contents: chapters, their sections, tools
# a tool's group is what the reader wants to do with it (group: in TOOLS, src/js/data/00-nav.js)
TOOL_GROUPS = [('plan', 'Подобрать и спланировать'), ('calc', 'Посчитать'), ('know', 'Разобраться')]
# a group's name on the home page's switch (a phone shows one group at a time)
TOOL_SEG = {'plan': 'Подобрать'}


def nav_items():
    """The guide's map for the contents (toc_html) and the home page's tools: the chapters (CHAPTERS in 00-nav.js)
    with their sections (each chapter's .subnav), the tools (TOOLS) with the place each one leads to."""
    data = (SRC / 'js' / 'data' / '00-nav.js').read_text(encoding='utf-8')
    chapters = []
    for m in re.finditer(r"\{ id: '([a-z]+)', num: (\d+), title: '([^']+)',([^{}]*?) desc: '([^']+)' \}", data):
        short = re.search(r"short: '([^']+)'", m.group(4))
        art = re.search(r"art: '([a-z-]+)'", m.group(4))
        chapters.append({'id': m.group(1), 'num': int(m.group(2)), 'title': m.group(3), 'short': short.group(1) if short else m.group(3),
                         'art': art.group(1), 'desc': m.group(5)})
    sections, panel_of = {}, {}
    for view, _ in PAGES:
        d = SRC / 'pages' / view
        if not (d / '_head.html').exists():
            continue
        nav = re.search(r'<nav class="subnav"[^>]*>(.*?)</nav>', (d / '_head.html').read_text(encoding='utf-8'), re.S)
        sections[view] = re.findall(r'<a href="#([^"]+)">([^<]+)</a>', nav.group(1))
        for f in sorted(d.glob('[0-9]*-*.html')):
            text = f.read_text(encoding='utf-8')
            panel = re.search(r'data-panel id="([^"]+)"', text).group(1)
            for i in re.findall(r'\sid="([^"]+)"', text):
                panel_of[i] = (view, panel)
    title = {c['id']: c['title'] for c in chapters} | {'moy': 'Мой базилик'}

    def where(hash):
        """«Глава · раздел» a tool opens on: the reader knows where the link leads"""
        if hash in title:
            return title[hash]
        view, panel = panel_of[hash]
        label = dict(sections.get(view, [])).get(panel)
        return f'{title[view]} · {label}' if label else title[view]
    # peek: the place the «Заглянуть» sheet shows when the link's own place is wider than the tool (a whole chapter)
    tools = [{'title': m.group(1), 'hash': m.group(2), 'icon': m.group(3), 'group': m.group(4), 'desc': m.group(5), 'peek': m.group(6) or '',
              'where': where(m.group(2))}
             for m in re.finditer(r"\{ title: '([^']+)', hash: '([^']+)', icon: '([^']+)', group: '([a-z]+)', desc: '([^']+)'(?:, peek: '([^']+)')? \}", data)]
    assert chapters and tools and all(t['group'] in dict(TOOL_GROUPS) or t['group'] == 'mine' for t in tools)
    return {'chapters': chapters, 'sections': sections, 'tools': tools}


def peek_attr(t):
    """the place a tool's «Заглянуть» sheet shows, when it is not the link's own (03-peek.js)"""
    return f' data-peek="{t["peek"]}"' if t.get('peek') else ''


def ico(name):
    return f'<svg class="ico"><use href="#i-{name}"/></svg>'


def toc_item(cid, face, label, subs, here=None, extra='', box='toc'):
    """one row of a chapters list — the contents and the home page's «Главы гида»: the chapter's link and, when it has
    sections, the button that opens them (03-sheets.js). The reader's own chapter is marked and open; box: the prefix
    of the sections' id (both lists stand on the home page)"""
    cur = cid == here
    mark = ' aria-current="page"' if cur else ''
    link = f'<a class="toc-link" href="#{cid}"{mark}{extra}>{face}</a>'
    if not subs:
        return f'<li class="toc-item" data-toc="{cid}"><div class="toc-row">{link}</div></li>'
    tog = (f'<button class="toc-tog" type="button" aria-expanded="{"true" if cur else "false"}" aria-controls="{box}-{cid}" '
           f'aria-label="Разделы: {escape(label)}"><span>{len(subs)}</span>{ico("chev-r")}</button>')
    sub = (f'<div class="toc-sub" id="{box}-{cid}"><ul>'
           + ''.join(f'<li><a href="#{pid}" data-p="{pid}">{escape(t)}</a></li>' for pid, t in subs) + '</ul></div>')
    return f'<li class="toc-item{" is-open" if cur else ""}" data-toc="{cid}"><div class="toc-row">{link}{tog}</div>{sub}</li>'


def toc_art(c):
    return f'<span class="toc-art"><svg viewBox="0 0 120 120" aria-hidden="true"><use href="#{c["art"]}"/></svg></span>'


def toc_html(nav, here):
    """The contents in every page (the sheet «Оглавление»): the home page and «Мой базилик», then the chapters — each
    opens into its sections; the tools by what they are for, each with the chapter and section it opens.
    The page's own chapter is marked and open."""
    def item(cid, face, label, subs, extra=''):
        return toc_item(cid, face, label, subs, here, extra)
    rows = [item('glavnaya', f'<span class="toc-ico">{ico("home")}</span><span class="toc-t">Главная</span>', 'Главная', []),
            item('moy', f'<span class="toc-ico">{ico("sprout")}<b class="garden-badge" hidden></b></span><span class="toc-t">Мой базилик</span>',
                 'Мой базилик', nav['sections'].get('moy', []), ' data-garden-link')]
    for c in nav['chapters']:
        rows.append(item(c['id'], f'{toc_art(c)}<span class="toc-t"><small>{c["num"]}</small>{escape(c["title"])}</span>', c['title'],
                         nav['sections'].get(c['id'], [])))
    chapters = f'<nav class="toc-pane toc-chapters" id="toc-ch" aria-label="Главы и разделы"><ul class="toc-list">{"".join(rows)}</ul></nav>'
    groups = ''.join(
        f'<section class="toc-group"><h3>{gt}</h3><ul>' + ''.join(
            f'<li><a class="toc-tool" href="#{t["hash"]}"{peek_attr(t)}><span class="toc-ico">{ico(t["icon"])}</span>'
            f'<span><b>{escape(t["title"])}</b><small>{escape(t["where"])}</small></span></a></li>'
            for t in nav['tools'] if t['group'] == g) + '</ul></section>'
        for g, gt in TOOL_GROUPS)
    return f'<div class="toc" data-pane="ch">{chapters}<nav class="toc-pane toc-tools" id="toc-tools" aria-label="Инструменты">{groups}</nav></div>'


def toc_button(nav, here):
    """the header's way into the contents: it says where the reader is"""
    c = next((c for c in nav['chapters'] if c['id'] == here), None)
    place = (f'<span class="toc-btn-n">{c["num"]}</span> <span class="toc-btn-t">{escape(c["short"])}</span>' if c
             else '<span class="toc-btn-t">Мой базилик</span>' if here == 'moy' else '<span class="toc-btn-t">Оглавление</span>')
    return (f'<button class="toc-btn" type="button" data-open="sheet-toc" aria-haspopup="dialog">{ico("book")}'
            f'<span class="toc-vh">Оглавление: </span><span class="toc-btn-p">{place}</span>{ico("chev-r")}</button>')


def chapters_home_html(nav):
    """the home page's «Главы гида»: the contents' list of chapters, each with what it holds in a line, opening into
    its sections (07-home.js folds them)"""
    return '<ul class="toc-list home-chapters" id="chapters">' + ''.join(
        toc_item(c['id'], f'{toc_art(c)}<span class="toc-tx"><span class="toc-t"><small>{c["num"]}</small>{escape(c["title"])}</span>'
                 f'<span class="toc-d">{escape(c["desc"])}</span></span>', c['title'], nav['sections'].get(c['id'], []), box='glavy')
        for c in nav['chapters']) + '</ul>'


def tools_home_html(nav):
    """the home page's tools by what they are for, each with the place it opens. A computer shows the groups side by
    side; a phone or a tablet — one group at a time, under a switch (07-home.js)"""
    seg = ('<div class="seg tools-seg" role="group" aria-label="Какие инструменты показать">' + ''.join(
        f'<button type="button" aria-pressed="{"true" if i == 0 else "false"}" aria-controls="tools-{g}" data-tools="{g}">'
        f'{TOOL_SEG.get(g, gt)}</button>'
        for i, (g, gt) in enumerate(TOOL_GROUPS)) + '</div>')
    return seg + '<div class="tools-groups" id="tools-home">' + ''.join(
        f'<section class="tools-group{" is-on" if i == 0 else ""}" id="tools-{g}" aria-label="{gt}"><h3 class="tools-gh">{gt}</h3><div class="tools-grid">' + ''.join(
            f'<a class="tool" href="#{t["hash"]}"{peek_attr(t)}><span class="t-ico">{ico(t["icon"])}</span><span><b>{escape(t["title"])}</b>'
            f'<small>{escape(t["desc"])}</small><span class="t-where">{escape(t["where"])}</span></span></a>'
            for t in nav['tools'] if t['group'] == g) + '</div></section>'
        for i, (g, gt) in enumerate(TOOL_GROUPS)) + '</div>'


# a one- or two-letter preposition, conjunction or particle: it goes to the next line with the word after it
SHORT_WORD = r'(?<![а-яёa-z\u00ad-])(в|с|к|у|о|а|и|я|во|со|ко|об|на|за|по|до|от|из|не|ни|но)'


def tie_js(text, words=False):
    """the text the scripts write keeps a dash with the word before it, as typeset does for the pages. A spaced «—» is
    never code, only words in strings and comments, and nothing compares strings by it. words: also a one-letter word
    with the next one — for models and drawings, whose Russian strings are only shown (the search's are compared)"""
    text = re.sub(r'(?<=[а-яёa-z0-9»)%°…]) — ', '\u00a0— ', text, flags=re.I)
    if words:
        text = re.sub(SHORT_WORD + r' (?=[а-яё«(\d])', '\\1\u00a0', text, flags=re.I)
    return text


# the chapter's science spreads, listed under its title (what science.js used to build as the page started:
# written here, the row stands in place from the first paint and the chapter does not jump down when it comes)
KIND_ICON = {'chem': 'hex', 'phys': 'wave', 'bio': 'cell', 'taste': 'nose'}


def deep_nav(html):
    deep = [dict(re.findall(r'([a-z-]+)="([^"]*)"', m.group(1))) for m in re.finditer(r'<details class="deep"([^>]*)>', html)]
    if not deep or '<div class="ch-hero-text">' not in html:
        return html
    deeper = len(re.findall(r'<details class="deeper"', html))
    ico = lambda n: f'<svg class="ico" aria-hidden="true"><use href="#i-{n}"/></svg>'
    nav = (f'<nav class="deep-index" aria-label="Научные развороты главы"><span class="deep-index-label">{ico("hex")}Глубже <b>{len(deep)}'
           + (f' · ещё глубже {deeper}' if deeper else '') + '</b></span>'
           + ''.join(f'<a href="#{d["id"]}" data-kind="{d["data-kind"]}">{ico(KIND_ICON[d["data-kind"]])}{d["data-short"]}</a>' for d in deep) + '</nav>')
    i = html.index('<div class="ch-hero-text">')
    j = html.index('</div>', i)
    return html[:j] + nav + html[j:]


def label_tables(html):
    """tables with a head: every body cell gets data-label — its column's name — so that on a phone, where the rows of
    a wide table (.table-wrap) or of a .mini-table.stack turn into cards (06-blocks.css), a cell can say which column
    it is from"""
    def one(m):
        heads = []
        for a, h in re.findall(r'<th([^>]*)>(.*?)</th>', m.group(2), re.S):
            span = re.search(r'colspan="(\d+)"', a)
            heads += [re.sub(r'<[^>]+>', '', h).strip()] * (int(span.group(1)) if span else 1)
        def row(r):
            k = 0
            def cell(c):
                nonlocal k
                name = heads[k] if k < len(heads) else ''
                span = re.search(r'colspan="(\d+)"', c.group(2))
                k += int(span.group(1)) if span else 1
                return f'<td data-label="{attr(name)}"{c.group(2)}>' if c.group(1) == 'td' and name else c.group(0)
            return re.sub(r'<(td|th)((?:\s[^>]*)?)>', cell, r.group(0))
        return m.group(1) + m.group(2) + re.sub(r'<tr(?![^>]*class="group")[^>]*>.*?</tr>', row, m.group(3), flags=re.S)
    return re.sub(r'(<table[^>]*>)(\s*<thead>.*?</thead>)(.*?</table>)', one, html, flags=re.S)


def typeset(html):
    """a number and the short word after it stay on one line («7–10 дней», «0,5 г/л», «3 пары»), and a range does not
    break after its dash («2–3», «+5…+10», a word joiner after the sign), nor a unit after its slash («мкмоль/м²·с»),
    a short word stays with the number after it («выше 32», «до 20 см»), a short preposition or conjunction with the word after
    it («и аромат», «за раз»), and a dash with the word before it: the same rule as
    nb() in src/js/app/00-core.js, for the text of the pages — not inside tags, scripts or styles"""
    out, skip = [], False
    for part in re.split(r'(<[^>]*>)', html):
        if part.startswith('<'):
            low = part[:8].lower()
            if low.startswith(('<script', '<style')):
                skip = True
            elif low.startswith(('</script', '</style')):
                skip = False
            out.append(part)
        else:
            if not skip and part.startswith(' — ') and out and re.match(r'</(b|i|a|em|strong|span|code|sup|sub)>', out[-1]):
                part = '\u00a0' + part[1:]  # «<b>слово</b> — …»: the dash stays with the word too
            out.append(part if skip else tie(part))
    return ''.join(out)


def tie(text):
    text = re.sub(r'([\d¼½¾]) (?=[^\s\d–—<&-]{1,6}(?=[\s,.;:)!?/<]|$))', '\\1\u00a0', text)  # 7 дней, ¼ дозы
    text = re.sub(r'(\d)([–…])(?=[+−]?\d)', '\\1\\2\u2060', text)  # 2–3, +5…+10
    text = re.sub(r'(?<![а-яёa-z])([а-яё]{1,4}) (?=[+−≈~]?[\d¼½¾])', '\\1\u00a0', text, flags=re.I)  # выше 32, в ¼
    text = re.sub(r'(?<=[^\s>]) — ', '\u00a0— ', text)  # a line never starts with a dash
    text = re.sub(SHORT_WORD + r' (?=\S)', '\\1\u00a0', text, flags=re.I)  # «и аромат», «за раз»
    return re.sub(r'(?<=[а-яё²³])/(?=[а-яё])', '/\u2060', text, flags=re.I)  # мкмоль/м²·с


def attr(s):
    return escape(s, quote=True)


# ---------------------------------------------------------------- sources → assets
BANNER = 'Файл собирает scripts/build.py из {src} — правьте там'


def split_selectors(prelude):
    """a selector list cut at its own commas, not at those inside :is(a, b) or [x="a,b"]"""
    out, depth, cur, quote = [], 0, '', None
    for ch in prelude:
        if quote:
            quote = None if ch == quote else quote
        elif ch in '"\'':
            quote = ch
        elif ch in '([':
            depth += 1
        elif ch in ')]':
            depth -= 1
        elif ch == ',' and depth == 0:
            out.append(cur)
            cur = ''
            continue
        cur += ch
    return out + [cur]


def hover_only(css):
    """«:hover» only where there is a mouse: a phone puts hover on whatever the finger lands on, and where the finger
    drags something itself (a sheet, a molecule) no scroll ever takes it off — the row stays lit. Every style rule with
    :hover goes into @media (hover: hover) in its place (same order, same weight); a list that mixes it with other
    selectors is split, the others stay as they are. Rules already inside such a @media, and keyframes, are left alone."""
    cuts = []  # (from, to, new text) for the rules to wrap
    stack = []  # the preludes of the blocks we are in
    i, start, n = 0, 0, len(css)
    while i < n:
        if css.startswith('/*', i):
            j = css.find('*/', i + 2)
            i = n if j < 0 else j + 2
            continue
        ch = css[i]
        if ch in '"\'':
            j = css.find(ch, i + 1)
            i = n if j < 0 else j + 1
            continue
        if ch == '{':
            prelude = css[start:i]
            notes = ''.join(re.findall(r'/\*.*?\*/\s*', prelude, re.S))
            name = re.sub(r'/\*.*?\*/', '', prelude, flags=re.S).strip()
            guarded = any(re.match(r'@media[^{]*\(hover:\s*hover\)', p) or re.match(r'@(-webkit-)?keyframes', p) for p in stack)
            if not name.startswith('@') and ':hover' in name and not guarded:
                end = css.index('}', i)  # a style rule holds no blocks of its own
                body = css[i:end + 1]
                lead = prelude[:len(prelude) - len(prelude.lstrip())]
                sels = [x.strip() for x in split_selectors(name)]
                hov, rest = [x for x in sels if ':hover' in x], [x for x in sels if ':hover' not in x]
                indent = lead.split('\n')[-1]
                piece = lead + notes + (f'{", ".join(rest)} {body}\n{indent}' if rest else '') + f'@media (hover: hover) {{ {", ".join(hov)} {body} }}'
                cuts.append((start, end + 1, piece))
                i = start = end + 1
                continue
            stack.append(name)
            start = i + 1
        elif ch == '}':
            if stack:
                stack.pop()
            start = i + 1
        elif ch == ';':
            start = i + 1
        i += 1
    # put back from the end, so that the positions before each cut still hold
    for a, b, piece in reversed(cuts):
        css = css[:a] + piece + css[b:]
    return css


def numbered(d, ext):
    """NN-name.ext files of a folder in their number order"""
    files = [f for f in d.glob('*' + ext) if re.match(r'\d+-', f.name)]
    return sorted(files, key=lambda f: (int(f.name.split('-', 1)[0]), f.name))


def read_page(view):
    d = SRC / 'pages' / view
    if not d.is_dir():
        return (SRC / 'pages' / f'{view}.html').read_text(encoding='utf-8')
    parts = [d / '_head.html', *numbered(d, '.html'), d / '_foot.html']
    return ''.join(f.read_text(encoding='utf-8') for f in parts)


def page_labs(html):
    return re.findall(r'data-lab="([a-z0-9]+)"', html)


def assemble(src_pages, assets):
    """write <assets>/js/*.js, <assets>/css/*.css and <assets>/js/labs/<view>.js from src/. Returns lab bundle names."""
    js, css = assets / 'js', assets / 'css'
    js.mkdir(parents=True, exist_ok=True)
    css.mkdir(parents=True, exist_ok=True)

    def banner(text, src):
        assert '*/' not in src and '/*' not in src, src
        # the first line of every frame is its title comment: add where the file comes from
        first, rest = text.split('\n', 1)
        if first.startswith('/*') and first.endswith('*/'):
            return first[:-2].rstrip() + '. ' + BANNER.format(src=src) + ' */\n' + rest
        return f'/* {BANNER.format(src=src)} */\n' + text

    for mod in ('data', 'scene', 'science', 'app'):
        d = SRC / 'js' / mod
        frame = (d / '_frame.js').read_text(encoding='utf-8')
        body = ''.join(f.read_text(encoding='utf-8') for f in numbered(d, '.js'))
        assert frame.count('/*@parts*/\n') == 1, mod
        (js / f'{mod}.js').write_text(tie_js(banner(frame.replace('/*@parts*/\n', body), f'src/js/{mod}/')), encoding='utf-8')
    shutil.copyfile(SRC / 'js' / 'haptics.js', js / 'haptics.js')
    fonts = assets / 'fonts'
    if fonts.exists():
        shutil.rmtree(fonts)
    fonts.mkdir()
    for f in sorted((SRC / 'fonts').glob('*.woff2')):
        shutil.copyfile(f, fonts / f.name)
    # the icons of the home screen (scripts/icons.js draws them)
    icons = assets / 'icons'
    if icons.exists():
        shutil.rmtree(icons)
    icons.mkdir()
    for f in sorted((SRC / 'icons').glob('*.png')):
        shutil.copyfile(f, icons / f.name)

    # every :hover of every sheet only where there is a mouse (hover_only): the sources keep writing plain :hover
    style = ''.join(f.read_text(encoding='utf-8') for f in numbered(SRC / 'css' / 'style', '.css'))
    (css / 'style.css').write_text(banner(hover_only(style), 'src/css/style/'), encoding='utf-8')

    # models: which page shows which, in page order
    order = [(v, page_labs(src_pages[v])) for v, _ in PAGES]
    known = {f.stem for f in (SRC / 'labs').glob('*/*.js') if not f.name.startswith('_') and f.parent.name != '_lib'}
    used = [l for _, labs in order for l in labs]
    assert len(used) == len(set(used)), 'a model is placed twice'
    assert set(used) <= known, set(used) - known
    assert known <= set(used), ('models no page shows', known - set(used))

    # the styles of the models go with the models: into their chapter's file, put on the page when it runs
    # (a model appears only after that). lab.css keeps what every page needs
    lab_css = {}
    for v, labs in order:
        # the chapter's own shared styles (_shared.css: a frame several models use), then each model's
        shared_css = SRC / 'labs' / v / '_shared.css'
        lab_css[v] = hover_only((shared_css.read_text(encoding='utf-8') if shared_css.exists() else '') + ''.join((SRC / 'labs' / v / f'{l}.css').read_text(encoding='utf-8') for l in labs if (SRC / 'labs' / v / f'{l}.css').exists()))
    lab = ''.join(f.read_text(encoding='utf-8') for f in numbered(SRC / 'css' / 'lab', '.css'))
    assert lab.count('/*@labs*/\n') == 1
    (css / 'lab.css').write_text(banner(hover_only(lab.replace('/*@labs*/\n', '')), 'src/css/lab/'), encoding='utf-8')

    frame = (SRC / 'labs' / '_frame.js').read_text(encoding='utf-8')
    out = js / 'labs'
    if out.exists():
        shutil.rmtree(out)
    out.mkdir()
    bundles = []
    CH = chapters()
    # a model asks for a shared drawing library with a line «/* @use micro */»; a library may ask for
    # another one the same way. Each library is a file of its own (labs/lib-<name>.js), loaded once and kept
    # in the cache from chapter to chapter; a chapter lists the ones it needs, in the order they go
    uses_of = lambda f: [x.strip() for m in re.finditer(r'/\* @use ([a-z, -]+) \*/', f.read_text(encoding='utf-8')) for x in m.group(1).split(',') if x.strip()]
    lib_src = lambda name: SRC / 'labs' / '_lib' / f'{name}.js'
    # the name a library goes by in the code: «const ill = (() => …» in ills.js
    lib_name = lambda name: re.search(r'^  const ([a-zA-Z]+) = \(\(\) => \{', lib_src(name).read_text(encoding='utf-8'), re.M).group(1)

    def need(name, libs):
        if name in libs:
            return
        for dep in uses_of(lib_src(name)):
            need(dep, libs)
        libs.append(name)

    deps, written = {}, []
    for v, labs in order:
        d = SRC / 'labs' / v
        shared = [d / '_shared.js'] if (d / '_shared.js').exists() else []
        # a chapter gets its file when it has models or pictures (_shared.js)
        if not labs and not shared:
            continue
        libs = []
        for f in shared + [d / f'{l}.js' for l in labs]:
            for x in uses_of(f):
                need(x, libs)
        for x in libs:
            if x in written:
                continue
            mine = []
            for dep in uses_of(lib_src(x)):
                need(dep, mine)
            text = (f'/* Гид по базилику — библиотека рисунков «{x}» */\n(() => {{\n  \'use strict\';\n'
                    f'  const L = window.BasilLibs = window.BasilLibs || {{}};\n'
                    + (f'  const {{ {", ".join(lib_name(m) for m in mine)} }} = L;\n' if mine else '')
                    + lib_src(x).read_text(encoding='utf-8')
                    + f'  L.{lib_name(x)} = {lib_name(x)};\n}})();\n')
            (out / f'lib-{x}.js').write_text(tie_js(banner(text, f'src/labs/_lib/{x}.js'), words=True), encoding='utf-8')
            written.append(x)
        head = (f'  const {{ {", ".join(lib_name(x) for x in libs)} }} = window.BasilLibs;\n' if libs else '')
        # the models' styles go onto the page with the chapter's first model (science.js, styleFor): a page that only
        # shows pictures never restyles itself for them, and none of it happens while the page starts
        if lab_css[v]:
            head += ('  window.BasilScience.styleFor(' + json.dumps(v) + ', ' + json.dumps(lab_css[v], ensure_ascii=False) + ');\n')
        body = head + '\n'.join(f.read_text(encoding='utf-8') for f in shared + [d / f'{l}.js' for l in labs])
        text = frame.replace('{{chapter}}', CH[v]['title'] if v in CH else v).replace('/*@labs*/\n', body)
        (out / f'{v}.js').write_text(tie_js(banner(text, f'src/labs/{v}/'), words=True), encoding='utf-8')
        bundles.append(v)
        deps[v] = libs
    stale = js / 'labs.js'
    if stale.exists():
        stale.unlink()
    return bundles, deps, written


def write_map(src_pages, CH):
    """MAP.md: where every tab, model, deep dive and script piece lives. Rebuilt on every build."""
    rel = lambda f: str(f.relative_to(ROOT))
    out = ['# Карта проекта', '',
           'Файл собирает `scripts/build.py` при каждой сборке — не правьте руками. Как работать с проектом — в `CLAUDE.md`.', '']
    out += ['## Главы и вкладки', '']
    for view, file in PAGES:
        ch = CH.get(view, {'title': 'Главная', 'num': 0})
        d = SRC / 'pages' / view
        url = '/' + SLUG[view]
        out.append(f"### {ch['title']} — `{url}` (`{file}`)")
        files = [d / '_head.html', *numbered(d, '.html'), d / '_foot.html'] if d.is_dir() else [SRC / 'pages' / f'{view}.html']
        rows = []
        for f in files:
            html = f.read_text(encoding='utf-8')
            m = re.search(r'<div class="panel" data-panel id="([^"]+)" data-title="([^"]+)"', html)
            tab = f"#{TAB[m.group(1)]} — {m.group(2)}" if m else ('обложка, вкладки' if f.name == '_head.html' else 'подвал главы' if f.name == '_foot.html' else 'вся глава')
            labs = page_labs(html)
            deeps = re.findall(r'<details class="deep" id="([^"]+)"[^>]*data-short="([^"]+)"', html)
            extra = []
            if labs:
                extra.append('модели: ' + ', '.join(f'`{l}`' for l in labs))
            if deeps:
                extra.append('глубже: ' + ', '.join(f'{t} `#{i}`' for i, t in deeps))
            rows.append(f"- `{rel(f)}` · {tab} · {html.count(chr(10))} стр." + (f"<br>{'; '.join(extra)}" if extra else ''))
        out += rows + ['']
    out += ['## Модели (src/labs/)', '', '| модель | глава | заголовок | файлы |', '|---|---|---|---|']
    for view, _ in PAGES:
        for lab in page_labs(src_pages[view]):
            js = SRC / 'labs' / view / f'{lab}.js'
            t = re.search(r"h\.head\((['\"`])(.+?)\1", js.read_text(encoding='utf-8'))
            files = [rel(js)] + ([rel(js.with_suffix('.css'))] if js.with_suffix('.css').exists() else [])
            out.append(f"| `{lab}` | {CH.get(view, {}).get('title', view)} | {t.group(2) if t else ''} | {' · '.join(f'`{x}`' for x in files)} |")
    out += ['', 'Общие помощники моделей — `src/labs/_frame.js`; инструменты графиков, кнопок и ползунков (`h.chart`, `h.plot`, `h.rangeHtml` …) — `src/js/science/`.', '']
    out += ['## Библиотеки рисунков (src/labs/_lib/)', '',
            'Модель или `_shared.js` главы подключает библиотеку строкой `/* @use micro, ills */`; сборка кладёт её в файл главы один раз.', '']
    for f in sorted((SRC / 'labs' / '_lib').glob('*.js')):
        first = next((l.strip() for l in f.read_text(encoding='utf-8').splitlines() if l.strip()), '')
        title = re.sub(r'^/\*\s*-*\s*|\s*-*\s*(\*/)?$', '', first)
        out.append(f"- `{rel(f)}` — {title}")
    out += ['', 'Иллюстрации на страницах — элементы `data-ill="художник:вариант"`; художники регистрируются через `illustrate()` в `src/labs/<глава>/_shared.js` и рисуются, когда элемент подходит к экрану. Все рисунки главы на одном листе: `node tests/gallery.js <глава>`.', '']
    for f in sorted((SRC / 'labs').glob('*/_shared.js')):
        names = re.findall(r"illustrate\('([a-z-]+)'", f.read_text(encoding='utf-8'))
        if names:
            out.append(f"- `{rel(f)}`: " + ', '.join(f'`{n}`' for n in names))
    out.append('')
    out += ['## Скрипты (src/js/)', '']
    for mod in ('app', 'science', 'scene', 'data'):
        out.append(f'**{mod}.js**')
        for f in numbered(SRC / 'js' / mod, '.js'):
            text = f.read_text(encoding='utf-8')
            names = re.findall(r'^  (?:function|const) ((?:init|Mol|Plant|render|draw)[A-Za-z]*|[A-Z][A-Z_]{2,})\b', text, re.M)
            out.append(f"- `{rel(f)}` ({text.count(chr(10))} стр.)" + (': ' + ', '.join(dict.fromkeys(names)) if names else ''))
        out.append('')
    out += ['## Стили (src/css/)', '']
    for mod in ('style', 'lab'):
        out.append(f'**{mod}.css**: ' + ', '.join(f'`{f.name}`' for f in numbered(SRC / 'css' / mod, '.css')))
    out.append('')
    (ROOT / 'MAP.md').write_text('\n'.join(out) + '\n', encoding='utf-8')


# a function or an arrow function at the given depth of a piece: «function x(», «const x = (…) =>», «const x = y =>»
FN_DECL = r'^{pad}(?:async\s+)?function\s+([A-Za-z_$][\w$]*)|^{pad}const\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>'


def declared(text, pad):
    """the names declared at one depth of a file, with their line numbers"""
    rx = re.compile(FN_DECL.format(pad=pad))
    return [(m.group(1) or m.group(2), i + 1) for i, line in enumerate(text.splitlines()) if (m := rx.match(line))]


def css_families(text):
    """the families of classes a stylesheet styles (.toc-*, .subnav, .g-install-*), most used first, and its animations"""
    text = re.sub(r'/\*.*?\*/', '', text, flags=re.S)
    fam, members = {}, {}
    for sel in re.findall(r'([^{}@;]+)\{', text):
        # in the order they first appear (not a set: its order changes from run to run, and so would the map)
        for cls in dict.fromkeys(re.findall(r'\.([a-zA-Z][\w-]*)', sel)):
            parts = cls.split('-')
            key = parts[0] if len(parts[0]) >= 3 or len(parts) == 1 else '-'.join(parts[:2])
            fam[key] = fam.get(key, 0) + 1
            members.setdefault(key, set()).add(cls)
    top = sorted(fam, key=lambda k: -fam[k])[:12]
    shown = [f'`.{k}-*`' if len(members[k]) > 1 or members[k] != {k} else f'`.{k}`' for k in top]
    return shown, re.findall(r'@keyframes\s+([\w-]+)', text)


def write_code_map():
    """CODE-MAP.md: where things are in the code — every function with its file and line, which stylesheet styles what,
    the site's events, storage keys and screen widths, the build's placeholders, what each test checks.
    Lists and links only: rebuilt on every build, so it cannot go out of date."""
    rel = lambda f: str(f.relative_to(ROOT))
    out = ['# Карта кода', '',
           'Файл собирает `scripts/build.py` при каждой сборке — не правьте руками. Содержание (главы, вкладки, модели, развороты) — '
           'в `MAP.md`, как работать с проектом — в `CLAUDE.md`. Ищите здесь по имени, прежде чем грепать исходники.', '']

    out += ['## Функции', '',
            'Имена верхнего уровня каждого куска с номером строки. Куски одного модуля (`src/js/<модуль>/NN-*.js`) — одна область '
            'видимости: имя, объявленное в одном, видно во всех следующих.', '']
    for mod in ('app', 'science', 'scene', 'data'):
        files = numbered(SRC / 'js' / mod, '.js')
        texts = {f: f.read_text(encoding='utf-8') for f in files}
        decl = {f: declared(t, '  ') for f, t in texts.items()}
        out.append(f'### {mod}.js')
        for f in files:
            if decl[f]:
                out.append(f"- `{rel(f)}`: " + ', '.join(f'`{n}` {ln}' for n, ln in decl[f]))
        # the helpers the other pieces call: who uses them
        shared = []
        for f in files:
            for n, ln in decl[f]:
                if len(n) < 3:
                    continue
                # a piece that has its own «resolve» (a parameter of the same name) does not call this one
                own = re.compile(r'[(,]\s*' + re.escape(n) + r'\s*[,)=]|(?<![\w$.])' + re.escape(n) + r'\s*=>')
                users = [g.stem for g in files if g != f and re.search(r'(?<![\w$.])' + re.escape(n) + r'\b', texts[g]) and not own.search(texts[g])]
                if len(users) >= 3:
                    shared.append(f"`{n}` ({f.name}:{ln}) — {len(users)}: {', '.join(users[:3])}{' …' if len(users) > 3 else ''}")
        if shared:
            out += ['', f'Общие помощники {mod}.js — кто зовёт:'] + [f'- {s}' for s in shared]
        out.append('')
    out.append('### Отдельные файлы')
    singles = [SRC / 'js' / 'haptics.js', SRC / 'labs' / '_frame.js'] + sorted((SRC / 'labs').glob('*/_shared.js'))
    for f in singles:
        d = declared(f.read_text(encoding='utf-8'), '  ')
        if d:
            out.append(f"- `{rel(f)}`: " + ', '.join(f'`{n}` {ln}' for n, ln in d))
    for f in sorted((SRC / 'labs' / '_lib').glob('*.js')):
        text = f.read_text(encoding='utf-8')
        lib = re.search(r'^  const (\w+) = \(\(\) => \{', text, re.M)
        d = declared(text, '    ')
        if d:
            out.append(f"- `{rel(f)}` (`{lib.group(1) if lib else f.stem}`): " + ', '.join(f'`{n}` {ln}' for n, ln in d))
    out.append('')

    out += ['## Стили', '', 'Какие семейства классов красит файл (самые частые первыми) и его анимации `@keyframes`.', '']
    for title, files in (('style.css', numbered(SRC / 'css' / 'style', '.css')), ('lab.css', numbered(SRC / 'css' / 'lab', '.css')),
                         ('стили моделей и глав', sorted((SRC / 'labs').glob('*/*.css')))):
        out.append(f'### {title}')
        for f in files:
            fams, keys = css_families(f.read_text(encoding='utf-8'))
            if fams or keys:
                out.append(f"- `{rel(f)}`: " + ', '.join(fams) + (f" · анимации: {', '.join(f'`{k}`' for k in keys)}" if keys else ''))
        out.append('')

    code = sorted((SRC / 'js').rglob('*.js')) + sorted((SRC / 'labs').rglob('*.js'))
    lines = [(f, i + 1, line) for f in code for i, line in enumerate(f.read_text(encoding='utf-8').splitlines())]
    out += ['## События', '', 'Свои события страницы (`document`): кто шлёт и кто слушает.', '']
    events = sorted({e for _, _, l in lines for e in re.findall(r"'(basil:[a-z-]+)'", l)})
    for ev in events:
        sent = [f'{rel(f)}:{n}' for f, n, l in lines if re.search(r"CustomEvent\('" + ev + "'", l)]
        heard = [f'{rel(f)}:{n}' for f, n, l in lines if re.search(r"addEventListener\('" + ev + "'", l)]
        out.append(f"- `{ev}` — шлёт: {', '.join(f'`{x}`' for x in sent) or '—'}; слушают: {', '.join(f'`{x}`' for x in heard) or '—'}")
    out += ['', '## Хранилище', '', 'Ключи `localStorage` (и база IndexedDB `basil-photos`) — в каких файлах встречаются, с первой строкой.', '']
    keys = sorted({k for _, _, l in lines for k in re.findall(r"'(basil-[a-z]+(?:-[a-z]+)*)'", l)})
    for k in keys:
        where = {}
        for f, n, l in lines:
            if f"'{k}'" in l and rel(f) not in where:
                where[rel(f)] = n
        out.append(f"- `{k}` — " + ', '.join(f'`{p}:{n}`' for p, n in where.items()))
    out += ['', '## Ширины экрана', '', 'Сколько правил `@media` на каждую ширину и в каких файлах. Новую ширину не придумывайте — берите ближайшую.', '']
    widths = {}
    for f in sorted((SRC / 'css').rglob('*.css')) + sorted((SRC / 'labs').rglob('*.css')):
        for kind, px in re.findall(r'@media[^{]*?\((max|min)-width:\s*(\d+)px\)', f.read_text(encoding='utf-8')):
            w = widths.setdefault((kind, int(px)), {})
            w[f.name] = w.get(f.name, 0) + 1
    for (kind, px), files in sorted(widths.items(), key=lambda x: (-sum(x[1].values()), x[0][1])):
        out.append(f"- `{kind}-width: {px}px` — {sum(files.values())}: " + ', '.join(f'{n} ×{c}' if c > 1 else n for n, c in sorted(files.items())))
    out += ['', '## Заполнители сборки', '', '`{{…}}` в каркасе и в работнике без сети — где их подставляет `scripts/build.py`.', '']
    build = (ROOT / 'scripts' / 'build.py').read_text(encoding='utf-8').splitlines()
    for src_file in (SRC / 'layout.html', SRC / 'sw.js'):
        for name in dict.fromkeys(re.findall(r'\{\{(\w+)\}\}', src_file.read_text(encoding='utf-8'))):
            at = [i + 1 for i, l in enumerate(build) if '{{' + name + '}}' in l and ('replace' in l or 'count' in l)]
            out.append(f"- `{{{{{name}}}}}` в `{rel(src_file)}` — `build.py:{at[0]}`" if at else f"- `{{{{{name}}}}}` в `{rel(src_file)}`")

    out += ['', '## Проверки', '', 'Что проверяет каждый набор `tests/*.js` (первая строка его шапки) и на чём: `сервер` — копия для хостинга '
            '`dist/site` через `scripts/serve.py`, `корень` — сборка в корне с диска. Все разом — `sh tests/run.sh`.', '']
    for f in sorted((ROOT / 'tests').glob('*.js')):
        if f.name == 'lib.js':
            continue
        text = f.read_text(encoding='utf-8')
        head = re.match(r'\s*/\*\s*(.*?)(?:\n|\*/)', text)
        on = ' + '.join(x for x, hit in (('сервер', 'server()' in text or 'serve.py' in text), ('корень', 'fileUrl(' in text)) if hit) or '—'
        pages = 'все страницы' if 'FILES' in text else ', '.join(dict.fromkeys(re.findall(r"'([a-z]+\.html)", text))) or ''
        out.append(f"- `{rel(f)}` — {head.group(1).strip() if head else ''} · {on}" + (f" · {pages}" if pages else ''))
    (ROOT / 'CODE-MAP.md').write_text('\n'.join(out) + '\n', encoding='utf-8')


def main():
    single = None
    if '--single' in sys.argv:
        single = Path(sys.argv[sys.argv.index('--single') + 1]).resolve()
    out_dir = ROOT
    if '--out' in sys.argv:
        out_dir = Path(sys.argv[sys.argv.index('--out') + 1]).resolve()
    # --clean: links say «урожай», not «urozhay.html»; the server maps one onto the other (.htaccess)
    clean = '--clean' in sys.argv
    # --no-sw: the offline worker switched off — sw.js removes itself and the saved copies from the readers' browsers
    no_sw = '--no-sw' in sys.argv
    LINK = {v: (SLUG[v] or './') for v, _ in PAGES} if clean else dict(FILE)

    layout = typeset((SRC / 'layout.html').read_text(encoding='utf-8'))  # the frame's own text: footer, sheets, search
    nav = nav_items()
    src = {v: read_page(v) for v, _ in PAGES}
    faq_here(src)
    CH = chapters()
    # a build for another place (--out, --single) leaves the one in the root as it is: checks read it meanwhile
    stage = Path(tempfile.mkdtemp(prefix='basil-book-')) if single else None
    assets = stage / 'assets' if single else out_dir / 'assets'
    if out_dir != ROOT and not single and assets.exists():
        shutil.rmtree(assets)  # a fresh copy: files removed from src/ must not linger on the hosting copy
    bundles, lib_deps, libs = assemble(src, assets)
    # chapters whose pictures (or models outside a closed «Глубже») stand on the page from the start: their files
    # come with the page (see page_html); the others wait until a model comes near the screen
    def shown_models(html):
        while True:
            bare = re.sub(r'<details[^>]*>(?:(?!<details).)*?</details>', '', html, flags=re.S)
            if bare == html:
                return 'data-lab=' in html
            html = bare
    eager = {v for v in bundles if (SRC / 'labs' / v / '_shared.js').exists() or shown_models(src[v])}

    # 1. give every searchable heading a stable id, and index the text
    static_entries_panels, static_entries_heads = [], []
    stats = {'kinds': {}, 'labs': 0, 'deeper': 0, 'deep': 0}
    titles = {}  # captions for links that lead to another page
    for view, _ in PAGES:
        html = src[view]
        dom = Builder(html).root
        ch = CH.get(view)
        inserts = []
        page_entries = []  # (entry, the nodes that hold its text, an extra node read first, its heading)
        n = 0
        parts_named = set()
        for node in dom.iter():
            if node.tag == '#text':
                continue
            if node.tag == 'details' and 'deep' in node.classes and node.attrs.get('id'):
                titles[node.attrs['id']] = 'Глубже: ' + node.attrs.get('data-short', '')
            if node.matches('[data-panel]') and ch:
                titles[node.attrs['id']] = f"{ch['title']} · {node.attrs.get('data-title', '')}"
            if node.matches('[data-panel]'):
                page_entries.append(({'title': node.attrs.get('data-title', ''), 'sub': ch['title'] if ch else '',
                                      'page': view, 'hash': node.attrs['id'], 'icon': 'list'}, [node], None, None))
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
                page_entries.append(({'title': text_of(t), 'sub': 'Ещё глубже · ' + (host.attrs.get('data-short') if host is not None else where),
                                      'page': view, 'hash': hid, 'icon': 'hex'}, [node.next_element()], None, None))
                continue
            if node.tag == 'summary' and 'deep' in parent.classes:
                page_entries.append(({'title': text_of(node.find('.deep-title')), 'sub': 'Глубже · ' + where,
                                      'page': view, 'hash': parent.attrs['id'], 'icon': 'hex'}, [parent.find('.deep-body')], node.find('.deep-sub'), None))
                continue
            hid = node.attrs.get('id')
            part = node.closest(['.tab-part'])
            if not hid and part is not None and part.attrs['id'] not in parts_named:
                # the first heading of a tab merged into another: found at the part's own anchor (/удобрения#план)
                hid = part.attrs['id']
                parts_named.add(hid)
            if not hid:
                n += 1
                hid = f'{view}-h{n}'
                inserts.append((node.pos, hid))
            deep = node.closest(['.deep'])
            page_entries.append(({'title': text_of(node), 'sub': where + (' · Глубже' + (': ' + deep.attrs['data-short'] if deep is not None and deep.attrs.get('data-short') else '') if deep is not None else ''),
                                  'page': view, 'hash': hid, 'icon': 'info' if node.tag == 'summary' else 'leaf'}, section_of(node), None, node))
        # every piece of text goes to one entry: the one whose section holds it most closely
        # (a heading's own section is left out of the tab, the deep dive or the card around it)
        owned = {id(n) for _, nodes, _, _ in page_entries for n in nodes}
        for e, nodes, extra, head in page_entries:
            # the heading itself is the entry's title, not its text
            skip = (owned - {id(n) for n in nodes}) | ({id(head)} if head is not None else set())
            text = ' '.join(t for t in [text_of(extra) if extra is not None else ''] + [text_own(n, skip) for n in nodes if n is not head] if t)
            e['text'] = text
            (static_entries_panels if e['icon'] == 'list' else static_entries_heads).append(e)
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

    alias = {} if single else dict(TAB)
    for view, _ in PAGES:
        panels = re.findall(r'<div class="panel" data-panel id="([^"]+)"', src[view])
        assert set(panels) <= set(TAB), set(panels) - set(TAB)
        # a tab merged into another lives on as a part of it (<section class="tab-part" id="<its old id>">) and keeps
        # its short anchor: /удобрения#план still leads to the plan
        ids = set(re.findall(r'\sid="([^"]+)"', src[view]))
        merged = sorted(ids & set(TAB) - set(panels))
        shorts = [TAB[i] for i in panels + merged]
        assert len(shorts) == len(set(shorts)), view
        clash = set(shorts) & ids
        assert not clash, (view, clash)
        if not single:
            for old in panels:
                src[view] = src[view].replace(f'data-panel id="{old}"', f'data-panel id="{TAB[old]}"')
            for old in merged:
                src[view] = re.sub(rf'(\sid=)"{re.escape(old)}"', rf'\1"{TAB[old]}"', src[view])

    def href_for(target, here):
        if single:
            return '#' + target
        anchor = alias.get(target, target)
        if target in FILE:
            if target == here:
                return '#' + target
            return LINK[target]
        page = owner.get(target) or next((p for pre, p in PREFIXES.items() if target.startswith(pre)), None)
        if not page or page == here:
            return '#' + anchor
        return f'{LINK[page]}#{anchor}'

    def rewrite_links(html, here):
        def fix(m):
            target = m.group(2)
            if target in ('main', 'top'):
                return m.group(0)
            return f'{m.group(1)}href="{href_for(target, here)}"'
        return re.sub(r'(<a\b[^>]*?\s)href="#([^"]+)"', fix, html)

    # 3. generated data files
    if out_dir != ROOT and clean:
        (out_dir / '.htaccess').write_text(htaccess(), encoding='ascii')
    js = out_dir / 'assets' / 'js'
    pages_js = {
        'files': LINK,
        'prefixes': PREFIXES,
        'ids': {k: v for k, v in sorted(owner.items()) if not k.startswith('lab-')},
        'stats': stats,
        'titles': titles,
        'alias': alias,
    }
    # the one-file book carries no map or index of its own: the files in assets/ stay those of the site
    if not single:
        (js / 'search-index.js').write_text(
            '/* Гид по базилику — поисковый индекс по тексту глав. Файл создаёт scripts/build.py */\n'
            'window.BASIL_SEARCH = ' + json.dumps(static_entries_panels + static_entries_heads, ensure_ascii=False, indent=0) + ';\n',
            encoding='utf-8')
        # every asset address carries a short fingerprint of its content (style.css?v=3f2a91c0):
        # after an update browsers fetch the new files instead of mixing them with cached old ones
        ver = lambda path: hashlib.sha1(path.read_bytes()).hexdigest()[:8]
        pages_js['v'] = {'labs': {v: ver(js / 'labs' / f'{v}.js') for v in bundles}, 'lib': {x: ver(js / 'labs' / f'lib-{x}.js') for x in libs},
                         'deps': lib_deps, 'search': ver(js / 'search-index.js')}
        (js / 'pages.js').write_text(
            '/* Гид по базилику — карта страниц. Файл создаёт scripts/build.py, правьте src/ */\n'
            'window.BASIL_PAGES = ' + json.dumps(pages_js, ensure_ascii=False, indent=1) + ';\n', encoding='utf-8')

    # the fonts' rules go into the <head> of every page, with the files' fingerprints like every other asset
    font_head = ''
    if not single:
        fv = lambda n: hashlib.sha1((out_dir / 'assets' / 'fonts' / n).read_bytes()).hexdigest()[:8]
        rules = (SRC / 'fonts' / 'fonts.css').read_text(encoding='utf-8')
        rules = re.sub(r'url\(fonts/([a-z0-9-]+\.woff2)\)', lambda m: f'url(assets/fonts/{m.group(1)}?v={fv(m.group(1))})', rules)
        # asked for at once on the hosting copy only: a page opened from disk has no origin, and a font fetched
        # ahead that way is refused — the page would fall back to the system font
        if clean:
            font_head = '\n'.join(f'<link rel="preload" href="assets/fonts/{n}?v={fv(n)}" as="font" type="font/woff2" crossorigin>' for n in PRELOAD_FONTS) + '\n'
        font_head += '<style>\n' + rules + '</style>'

    # the hosting copy can be put on a phone's home screen and works offline (write_pwa): its pages link the app's card
    pwa_head = ''
    if clean:
        pwa_head = (f'<link rel="manifest" href="manifest.webmanifest"{" data-sw" if not no_sw else ""}>\n'
                    f'<link rel="apple-touch-icon" href="assets/icons/apple-touch-icon.png?v={ver(out_dir / "assets" / "icons" / "apple-touch-icon.png")}">\n'
                    '<meta name="mobile-web-app-capable" content="yes">\n'
                    '<meta name="apple-mobile-web-app-capable" content="yes">\n'
                    f'<meta name="apple-mobile-web-app-title" content="{APP_SHORT}">\n')

    def fingerprint(html):
        if single:
            return html
        return re.sub(r'((?:href|src)="(assets/(?:css|js)/(?:labs/)?[a-z-]+\.(?:css|js)))"', lambda m: f'{m.group(1)}?v={ver(out_dir / m.group(2))}"', html)

    # 4. pages
    def page_html(views, here):
        content = label_tables(typeset('\n'.join(deep_nav(src[v]) for v in views)))
        if not single:
            content = content.replace('<section class="view', '<section class="view is-active', 1)
            # first panel is visible straight from the HTML, before any script runs
            content = re.sub(r'(<div class="panel)(" data-panel)', r'\1 is-active\2', content, count=1)
        ch = CH.get(here)
        title = f"{ch['title']} — {SITE_TITLE}" if ch and not single else SITE_TITLE
        desc = (f"{ch['desc']} Глава {ch['num']} гида по выращиванию базилика." if ch['num'] else ch['desc']) if ch and not single else SITE_DESC
        out = layout.replace('{{content}}', content)
        # the contents and the home page's tools: written here, so that every link is a link from the start
        out = out.replace('{{toc}}', typeset(toc_html(nav, None if single else here))).replace('{{tocbtn}}', toc_button(nav, None if single else here))
        out = out.replace('<div class="tools-grid" id="tools-home"></div>', typeset(tools_home_html(nav)))
        out = out.replace('<div class="chapters" id="chapters"></div>', typeset(chapters_home_html(nav)))
        out = out.replace('{{title}}', escape(title)).replace('{{description}}', attr(desc))
        out = rewrite_links(out, here)
        scripts = '\n'.join(f'<script src="assets/js/{s}" defer></script>' for s in SCRIPTS if not (single and s == 'pages.js'))
        # a chapter whose pictures stand on the page from the start brings its picture files with it: they run right
        # after science.js, before the interface starts, so the pictures on the screen are drawn at DOMContentLoaded
        if not single and here in eager:
            scripts = scripts.replace('<script src="assets/js/science.js" defer></script>',
                                      '<script src="assets/js/science.js" defer></script>\n'
                                      + '\n'.join(f'<script src="assets/js/labs/{n}.js" defer></script>' for n in [f'lib-{x}' for x in lib_deps.get(here, [])] + [here]))
        if single:
            scripts = scripts.replace('<script src="assets/js/science.js" defer></script>',
                                      '<script src="assets/js/science.js" defer></script>\n'
                                      + '\n'.join([f'<script src="assets/js/labs/lib-{x}.js" defer></script>' for x in libs]
                                                   + [f'<script src="assets/js/labs/{v}.js" defer></script>' for v in bundles]))
        out = out.replace('{{scripts}}', scripts)
        out = out.replace('{{fonts}}', GOOGLE_FONTS if single else font_head)
        out = out.replace('{{pwa}}\n', pwa_head)
        return fingerprint(out)

    if single:
        html = page_html([v for v, _ in PAGES], 'glavnaya')
        tmp = stage / 'book.html'
        tmp.write_text(html, encoding='utf-8')
        import subprocess
        subprocess.run([sys.executable, str(ROOT / 'scripts' / 'bundle.py'), str(single), '--from', str(tmp), '--root', str(stage)], check=True)
        shutil.rmtree(stage)
        return

    # the maps describe the sources: the build in the root writes them
    if out_dir == ROOT:
        write_map(src, CH)
        write_code_map()
    for view, file in PAGES:
        (out_dir / file).write_text(page_html([view], view), encoding='utf-8')
        print(f'{file:18} {len((out_dir / file).read_bytes()) // 1024:4} КБ')
    if clean:
        write_pwa(out_dir, pages_js['v'], no_sw)
    print(f'pages.js {len((js / "pages.js").read_bytes()) // 1024} КБ, search-index.js {len((js / "search-index.js").read_bytes()) // 1024} КБ, '
          f'{len(static_entries_panels) + len(static_entries_heads)} записей в индексе')


def write_pwa(out_dir, v, no_sw):
    """The hosting copy on a phone's home screen: the app's card (manifest.webmanifest) and the offline worker
    (sw.js from src/sw.js). The worker keeps every page by its Russian address and every file the pages ask for:
    styles, scripts, the models' files, the search index, the Cyrillic and Latin fonts, the icons."""
    pages = [SLUG[view] or './' for view, _ in PAGES]
    found = set()
    for _, file in PAGES:
        html = (out_dir / file).read_text(encoding='utf-8')
        found.update(re.findall(r'(?:href|src)="(assets/[^"?]+\?v=[0-9a-f]+)"', html))
        # the fonts of the page's own alphabets; the other ones (Greek, Vietnamese…) are kept when first asked for
        found.update(re.findall(r'url\((assets/fonts/[a-z0-9-]+-(?:cyrillic|latin)\.woff2\?v=[0-9a-f]+)\)', html))
    # what the pages fetch later, by the fingerprints in pages.js
    found.update(f'assets/js/labs/{n}.js?v={h}' for n, h in v['labs'].items())
    found.update(f'assets/js/labs/lib-{n}.js?v={h}' for n, h in v['lib'].items())
    found.add(f'assets/js/search-index.js?v={v["search"]}')
    ver = lambda path: hashlib.sha1(path.read_bytes()).hexdigest()[:8]
    icon = lambda n: f'assets/icons/{n}?v={ver(out_dir / "assets" / "icons" / n)}'
    icons = [icon(n) for n in ('icon-192.png', 'icon-512.png', 'icon-maskable-512.png')]
    files = sorted(found | set(icons))
    for f in files:
        assert (out_dir / f.split('?')[0]).exists(), f
    shortcut = lambda name, view, desc: {'name': name, 'url': SLUG[view], 'description': desc,
                                         'icons': [{'src': icons[0], 'sizes': '192x192', 'type': 'image/png'}]}
    card = {
        'id': './',
        'name': SITE_TITLE,
        'short_name': APP_SHORT,
        'description': 'Как вырастить базилик: сорта, посадка, уход, удобрения, урожай, болезни — и ваши кусты '
                       'с делами на неделю, погодой и опытами.',
        'lang': 'ru',
        'dir': 'ltr',
        'start_url': './',
        'scope': './',
        'display': 'standalone',
        'background_color': '#EEF4E9',
        'theme_color': '#2D6932',
        'categories': ['education', 'lifestyle'],
        'icons': [{'src': icons[0], 'sizes': '192x192', 'type': 'image/png', 'purpose': 'any'},
                  {'src': icons[1], 'sizes': '512x512', 'type': 'image/png', 'purpose': 'any'},
                  {'src': icons[2], 'sizes': '512x512', 'type': 'image/png', 'purpose': 'maskable'}],
        'shortcuts': [shortcut('Мой базилик', 'moy', 'Ваши кусты, дела на неделю, погода и опыты'),
                      shortcut('Проблемы', 'problemy', 'Что с листьями: болезни, вредители, нехватка питания'),
                      shortcut('Календарь', 'kalendar', 'Сроки посева, высадки и сбора под ваш климат')],
    }
    manifest = json.dumps(card, ensure_ascii=False, indent=1) + '\n'
    (out_dir / 'manifest.webmanifest').write_text(manifest, encoding='utf-8')
    if no_sw:
        shutil.copyfile(SRC / 'sw-off.js', out_dir / 'sw.js')
        print('sw.js — выключатель: снимает себя и сохранённые копии')
        return
    template = (SRC / 'sw.js').read_text(encoding='utf-8')
    # the version: a fingerprint of the worker, the card, every page and every file it keeps
    sha = hashlib.sha1(template.encode('utf-8') + manifest.encode('utf-8'))
    for view, file in PAGES:
        sha.update((out_dir / file).read_bytes())
    for f in files:
        sha.update(f.encode('utf-8'))
    keep = pages + files
    assert template.count("'{{version}}'") == 1 and template.count('{{precache}}') == 1
    sw = template.replace("'{{version}}'", json.dumps(sha.hexdigest()[:10])).replace('{{precache}}', json.dumps(keep, ensure_ascii=False, indent=1))
    (out_dir / 'sw.js').write_text(sw, encoding='utf-8')
    size = sum((out_dir / FILE[view]).stat().st_size for view, _ in PAGES) + sum((out_dir / f.split('?')[0]).stat().st_size for f in files)
    print(f'sw.js: {len(keep)} адресов, {size // 1024} КБ без сжатия')


if __name__ == '__main__':
    main()
