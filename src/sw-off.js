/* Гид по базилику — выключатель работы без сети. Его кладёт в корень вместо sw.js сборка
   python3 scripts/build.py --clean --out dist/site --no-sw
   Браузер читателя сам проверяет sw.js при каждом заходе: найдя этот файл, он ставит его вместо прежнего, а этот
   стирает сохранённые копии гида и снимает себя. Страницы идут из сети, как до работы без сети. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('basil-')) await caches.delete(k);
    await self.registration.unregister();
  })());
});
