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
  const port = 8790 + Math.floor(Math.random() * 200);
  const proc = spawn('python3', [path.join(ROOT, 'scripts/serve.py'), '--port', String(port)], { stdio: ['ignore', 'pipe', 'inherit'] });
  await new Promise((resolve, reject) => {
    proc.stdout.once('data', resolve);
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

const FILES = ['index.html', 'sorta.html', 'posadka.html', 'kalendar.html', 'uhod.html', 'udobreniya.html', 'formirovka.html', 'urozhay.html', 'vkus.html', 'razmnozhenie.html', 'problemy.html', 'spravka.html'];
const SLUGS = { glavnaya: '', sorta: 'сорта', posadka: 'посадка', kalendar: 'календарь', uhod: 'уход', udobreniya: 'удобрения', formirovka: 'прищипывание', urozhay: 'урожай', vkus: 'вкус', razmnozhenie: 'размножение', problemy: 'проблемы', spravka: 'справка' };
const fileUrl = f => 'file://' + path.join(ROOT, f);

module.exports = { ROOT, OUT, playwright, server, ok, done, watch, FILES, SLUGS, fileUrl, results };
