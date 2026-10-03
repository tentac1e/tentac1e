/* Гид по базилику — работа без сети (service worker). Файл sw.js в корне сайта собирает scripts/build.py --clean
   из src/sw.js: VERSION — отпечаток всех файлов списка, PRECACHE — страницы по русским адресам и всё, что им нужно.
   Страница — сначала из сети, а если сеть молчит дольше 3 с или её нет — сохранённая копия.
   Файл с отпечатком (?v=…) не меняется никогда: он берётся из кэша, не спрашивая сеть.
   Чужие адреса (погода Open-Meteo) идут мимо: прогноз хранит сам интерфейс. */
const VERSION = '{{version}}';
const PRECACHE = {{precache}};
const SHELL = 'basil-' + VERSION; // the pages and their files, fetched at install
const RT = 'basil-rt-' + VERSION; // what else a page asked for: fonts of other alphabets, a file of a newer copy
const WAIT = 3000;
const SCOPE = new URL('./', self.location);
const ASSETS = new URL('assets/', SCOPE).pathname;
const MATCH = { ignoreVary: true };

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const shell = await caches.open(SHELL);
    await Promise.all(PRECACHE.map(async path => {
      const url = new URL(path, SCOPE).href, fixed = url.includes('?v=');
      // a file with the same fingerprint is the same file: an older copy gives it, nothing is downloaded again
      const old = fixed && await caches.match(url, MATCH);
      const res = old || await fetch(new Request(url, { cache: fixed ? 'default' : 'no-cache' }));
      if (!res.ok) throw new Error(`${path}: ${res.status}`);
      await shell.put(url, res);
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('basil-') && k !== SHELL && k !== RT) await caches.delete(k);
    // the page request goes out while this worker wakes up, not after
    if (self.registration.navigationPreload) await self.registration.navigationPreload.enable().catch(() => {});
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== SCOPE.origin) return;
  if (req.mode === 'navigate') e.respondWith(page(e, url));
  else if (url.pathname.startsWith(ASSETS)) e.respondWith(file(e, url));
});

// the copy of a page: by its address without the query, else the home page
const copyOf = url => caches.match(url.origin + url.pathname, MATCH).then(r => r || caches.match(SCOPE.href, MATCH));

async function page(e, url) {
  let saved = Promise.resolve();
  const net = Promise.resolve(e.preloadResponse).then(r => r || fetch(e.request)).then(res => {
    // a fresh page replaces its copy; a redirect or an error does not
    if (res.ok && res.type === 'basic' && !res.redirected) {
      const copy = res.clone();
      saved = caches.open(SHELL).then(c => c.put(url.origin + url.pathname, copy));
    }
    return res;
  });
  e.waitUntil(net.then(() => saved, () => {}));
  const slow = new Promise(r => setTimeout(r, WAIT, null));
  try {
    const res = await Promise.race([net, slow]);
    if (res) return res;
    // the network is slow: the copy if there is one, else keep waiting for the network
    return (await copyOf(url)) || await net;
  } catch (err) {
    return (await copyOf(url)) || Response.error();
  }
}

async function file(e, url) {
  const fixed = url.searchParams.has('v');
  if (fixed) {
    const hit = await caches.match(e.request, MATCH);
    if (hit) return hit;
  }
  try {
    const res = await fetch(e.request);
    if (fixed && res.ok && res.type === 'basic') {
      const copy = res.clone();
      e.waitUntil(caches.open(RT).then(c => c.put(e.request, copy)));
    }
    return res;
  } catch (err) {
    // without the network: the same file of another fingerprint is better than none
    const any = await caches.match(e.request, { ignoreSearch: true, ignoreVary: true });
    if (any) return any;
    throw err;
  }
}
