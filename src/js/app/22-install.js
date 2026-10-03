  /* ================================================================== */
  /* ON THE HOME SCREEN: the offline worker and «Установить»             */
  /* ================================================================== */
  // the hosting copy links the app's card (scripts/build.py --clean): there sw.js keeps every page and its files, and
  // the guide opens without the network. A page opened from disk and the one-file book have neither
  function initInstall() {
    const card = $('link[rel="manifest"]');
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
    if (card && 'serviceWorker' in navigator && (location.protocol === 'https:' || local)) {
      // after the page has loaded and settled: the copies are fetched while the reader reads
      const go = () => setTimeout(() => {
        if (card.hasAttribute('data-sw')) navigator.serviceWorker.register('sw.js').catch(() => {});
        // the worker switched off (build.py --no-sw): a worker left from before is dropped
        else navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister())).catch(() => {});
      }, 2000);
      if (document.readyState === 'complete') go(); else addEventListener('load', go, { once: true });
    }

    // the bushes, the diary and the photos stay when the browser clears space: asked for once there is a bush
    const keep = () => {
      const st = navigator.storage;
      if (st && st.persist) st.persisted().then(yes => yes || st.persist()).catch(() => {});
    };
    document.addEventListener('basil:garden', () => { if (window.BasilGarden && window.BasilGarden.load().plants.length) keep(); });

    // the copies kept for working offline (hosting copy with the worker): how much they take, and «Обновить» —
    // the worker fetches every file afresh and only then drops the old ones. The bushes, the diary, the photos and
    // the experiments live elsewhere (localStorage, IndexedDB) and are never touched
    const copies = $('#garden-copies');
    if (copies && card && card.hasAttribute('data-sw') && 'serviceWorker' in navigator && (location.protocol === 'https:' || local) && window.MessageChannel) {
      const ask = (type, ms) => navigator.serviceWorker.ready.then(reg => new Promise((resolve, reject) => {
        if (!reg.active) { reject(new Error('no worker')); return; }
        const ch = new MessageChannel();
        const t = setTimeout(() => reject(new Error('no answer')), ms);
        ch.port1.onmessage = e => { clearTimeout(t); resolve(e.data || {}); };
        reg.active.postMessage({ type }, [ch.port2]);
      }));
      const mb = n => nb(`${(n / 1048576).toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} МБ`);
      // the line stands from the first frame (the page does not jump when the worker answers); the size comes later
      const draw = bytes => {
        copies.innerHTML = `<span>Копии гида для работы без сети — <b data-copies-size>${bytes ? mb(bytes) : nb('… МБ')}</b></span>
          <button class="g-link" type="button" data-copies>Обновить</button><small>кусты и фото останутся</small>`;
        copies.hidden = false;
      };
      draw(0);
      ask('size', 60000).then(r => { if (r.bytes) $('[data-copies-size]', copies).textContent = mb(r.bytes); }).catch(() => {});
      copies.addEventListener('click', async e => {
        const btn = e.target.closest('[data-copies]');
        if (!btn || btn.disabled) return;
        btn.disabled = true;
        btn.textContent = 'Обновляю…';
        // a newer sw.js on the hosting (a fresh build) installs itself with its own copies
        try { const reg = await navigator.serviceWorker.getRegistration(); if (reg) await reg.update(); } catch (err) { /* offline */ }
        let r = null;
        try { r = await ask('refresh', 120000); } catch (err) { r = null; }
        if (r && r.bytes) $('[data-copies-size]', copies).textContent = mb(r.bytes);
        btn.disabled = false;
        btn.textContent = 'Обновить';
        toast(r && r.ok ? 'Копии обновлены' : 'Нет сети — копии остались прежними');
      });
    }

    const box = $('#garden-install');
    if (!box || !card) return;
    const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
    const ios = /iP(hone|od|ad)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const off = () => { try { return localStorage.getItem('basil-install') === 'off'; } catch (e) { return false; } };
    const pic = ($('link[rel="apple-touch-icon"]') || {}).href;
    let ask = null;
    const show = () => {
      if (standalone() || off() || !(ask || ios)) { box.hidden = true; box.innerHTML = ''; return; }
      box.innerHTML = `<div class="g-install-in">
        ${pic ? `<img class="g-install-pic" src="${pic}" alt="" width="48" height="48">` : ''}
        <div class="g-install-t"><b>Гид на экране телефона</b>
          <p>Откроется одним касанием, как приложение, и без сети: главы, ваши кусты и опыты всегда под рукой.</p>
          ${ask ? '' : '<p class="g-install-ios">Нажмите «Поделиться» и выберите «На экран „Домой“».</p>'}</div>
        <div class="g-install-a">${ask ? `<button class="btn btn-primary btn-small" type="button" data-install>${icon('check')}Установить</button>` : ''}<button class="g-link" type="button" data-install-off>${ask ? 'Не сейчас' : 'Понятно'}</button></div>
      </div>`;
      box.hidden = false;
    };
    addEventListener('beforeinstallprompt', e => { e.preventDefault(); ask = e; show(); });
    addEventListener('appinstalled', () => { ask = null; box.hidden = true; keep(); toast('Гид на экране телефона'); });
    box.addEventListener('click', async e => {
      if (e.target.closest('[data-install]') && ask) {
        const a = ask;
        ask = null;
        a.prompt();
        try { await a.userChoice; } catch (err) { /* the browser closed its question */ }
        show();
      } else if (e.target.closest('[data-install-off]')) {
        try { localStorage.setItem('basil-install', 'off'); } catch (err) { /* private mode: hidden until the next visit */ }
        box.hidden = true;
      }
    });
    show();
  }
