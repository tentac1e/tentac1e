/* Общее для проверок: Playwright, локальный сервер, счёт PASS/FAIL. */
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(__dirname, 'out');

function playwright() {
  for (const p of ['playwright', '/opt/node22/lib/node_modules/playwright']) {
    try { return require(p); } catch (e) { /* next */ }
  }
  throw new Error('Нужен Playwright: npm i -g playwright (браузер Chromium)');
}

// the hosting copy served with the same addresses as .htaccess gives (scripts/serve.py)
async function server() {
  if (process.env.BASE) return { base: process.env.BASE.replace(/\/$/, ''), stop() {} };
  if (!fs.existsSync(path.join(ROOT, 'dist/site/index.html'))) throw new Error('Нет dist/site: python3 scripts/build.py --clean --out dist/site');
  return serve(path.join(ROOT, 'dist/site'));
}
// scripts/serve.py on a port the system picks (checks run side by side): its first line names it.
// A given port puts a stopped server back at the same address
async function serve(dir, at = 0) {
  const proc = spawn('python3', [path.join(ROOT, 'scripts/serve.py'), '--port', String(at), '--dir', dir], { stdio: ['ignore', 'pipe', 'inherit'] });
  const port = await new Promise((resolve, reject) => {
    proc.stdout.once('data', d => { const m = /:(\d+)\//.exec(String(d)); if (m) resolve(m[1]); else reject(new Error('serve.py said ' + d)); });
    proc.once('exit', c => reject(new Error('serve.py exited ' + c)));
  });
  return { base: `http://127.0.0.1:${port}`, stop() { proc.kill(); } };
}

const results = { pass: 0, fail: 0 };
function ok(cond, msg) {
  if (cond) results.pass++; else results.fail++;
  console.log((cond ? 'PASS ' : 'FAIL ') + msg);
  return cond;
}
function done(errors = []) {
  const errs = errors.filter(Boolean);
  if (errs.length) { console.log('JS errors:'); errs.forEach(e => console.log('  ' + e)); }
  console.log(`— ${results.pass} passed, ${results.fail} failed${errs.length ? ', ' + errs.length + ' JS errors' : ''}`);
  process.exitCode = results.fail || errs.length ? 1 : 0;
}

// collect page errors; fonts and offline noise are not ours
function watch(page, errs) {
  page.on('pageerror', e => errs.push(page.url().replace(/^.*\//, '') + ': ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_CERT|fonts|net::ERR_(NAME|INTERNET|CONN|TUNNEL|PROXY)|Failed to load resource/.test(m.text())) errs.push(page.url().replace(/^.*\//, '') + ': ' + m.text()); });
}

// where a page landed after a return to a place in the text: the first marked line (.resume-mark), what covers the
// page above it, and the words it starts with
function landedAt(page) {
  return page.evaluate(() => {
    const i = document.querySelector('.resume-mark i');
    if (!i) return null;
    const r = i.getBoundingClientRect();
    // the words from the marked line's first letter to the end of its block
    const hit = document.caretRangeFromPoint(r.left + 5, r.top + r.height / 2);
    let words = '';
    if (hit) {
      let node = hit.startContainer, off = hit.startOffset;
      if (node.nodeType !== 3) {
        const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        w.currentNode = node.childNodes[off] || node;
        do { node = w.nextNode(); } while (node && !node.data.trim());
        off = 0;
      }
      if (node) {
        const rg = document.createRange();
        rg.setStart(node, off);
        const blk = node.parentElement.closest('p, li, dt, dd, h2, h3, h4, h5, summary, blockquote, figcaption, tr, pre, .card') || document.body;
        rg.setEndAfter(blk.lastChild || blk);
        words = rg.toString().replace(/\s+/g, ' ').trim();
      }
    }
    const wrap = document.querySelector('[data-view].is-active .subnav-wrap');
    const end = Math.round(scrollY) >= document.documentElement.scrollHeight - innerHeight - 2;
    return { top: Math.round(r.top), cover: wrap ? Math.round(wrap.getBoundingClientRect().bottom) : 0, words: words.slice(0, 30), y: Math.round(scrollY), vh: innerHeight, end };
  });
}

const FILES = ['index.html', 'sorta.html', 'posadka.html', 'uhod.html', 'udobreniya.html', 'formirovka.html', 'vkus.html', 'problemy.html', 'spravka.html', 'moy.html'];
const SLUGS = { glavnaya: '', sorta: 'сорта', posadka: 'посадка', uhod: 'уход', udobreniya: 'удобрения', formirovka: 'прищипывание', vkus: 'вкус', problemy: 'проблемы', spravka: 'справка', moy: 'мой-базилик' };
// the chapters merged into others (MOVED in scripts/build.py): their pages only send the reader on
const MOVED = { kalendar: 'календарь', urozhay: 'урожай', razmnozhenie: 'размножение' };
const fileUrl = f => 'file://' + path.join(ROOT, f);

module.exports = { ROOT, OUT, playwright, server, serve, ok, done, watch, landedAt, FILES, SLUGS, MOVED, fileUrl, results };
