  /* ================================================================== */
  /* MY BASIL: photos of a bush, kept in this browser (IndexedDB)        */
  /* ================================================================== */
  // a photo is shrunk before it is kept: 1280 px on the long side, JPEG — about 200 KB instead of 3–5 MB
  const PHOTO_DB = 'basil-photos', PHOTO_MAX = 1280;
  let photoDb = null;
  function photoOpen() {
    if (!photoDb) {
      photoDb = new Promise((resolve, reject) => {
        if (!window.indexedDB) { reject(new Error('no IndexedDB')); return; }
        const r = indexedDB.open(PHOTO_DB, 1);
        r.onupgradeneeded = () => r.result.createObjectStore('photos');
        r.onsuccess = () => resolve(r.result);
        r.onerror = () => reject(r.error);
      });
      photoDb.catch(() => { photoDb = null; });
    }
    return photoDb;
  }
  const photoReq = (mode, fn) => photoOpen().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction('photos', mode), req = fn(tx.objectStore('photos'));
    tx.oncomplete = () => resolve(req && 'result' in req ? req.result : undefined);
    tx.onerror = tx.onabort = () => reject(tx.error);
  }));
  const photoPut = (id, blob) => photoReq('readwrite', st => st.put(blob, id));
  const photoGet = id => photoReq('readonly', st => st.get(id));
  const photoDel = id => photoReq('readwrite', st => st.delete(id)).catch(() => {});
  const photoIds = p => (p.log || []).filter(e => e.k === 'photo' && e.ph).map(e => e.ph);

  // a picture from the camera or the gallery, turned the way it was shot and made smaller
  async function photoShrink(file) {
    let img;
    try { img = await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch (e) {
      img = await new Promise((resolve, reject) => { const i = new Image(); i.onload = () => resolve(i); i.onerror = reject; i.src = URL.createObjectURL(file); });
    }
    const w0 = img.width, h0 = img.height, k = Math.min(1, PHOTO_MAX / Math.max(w0, h0));
    const c = document.createElement('canvas');
    c.width = Math.round(w0 * k);
    c.height = Math.round(h0 * k);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    if (img.close) img.close();
    return new Promise((resolve, reject) => c.toBlob(b => (b ? resolve(b) : reject(new Error('toBlob'))), 'image/jpeg', 0.82));
  }

  // thumbnails are written with data-photo="id" and get their picture once it is read
  const photoUrls = new Map();
  function fillPhotos(root) {
    $$('img[data-photo]', root).forEach(img => {
      const id = img.dataset.photo;
      if (photoUrls.has(id)) { img.src = photoUrls.get(id); return; }
      photoGet(id).then(blob => {
        if (!blob) { img.closest('.g-photo') && img.closest('.g-photo').classList.add('is-gone'); return; }
        const url = URL.createObjectURL(blob);
        photoUrls.set(id, url);
        $$(`img[data-photo="${id}"]`).forEach(x => { x.src = url; });
      }, () => {});
    });
  }
  function forgetPhoto(id) {
    if (photoUrls.has(id)) { URL.revokeObjectURL(photoUrls.get(id)); photoUrls.delete(id); }
    return photoDel(id);
  }

  // one photo, large, over the page
  function showPhoto(id, caption) {
    let dlg = $('#photo-view');
    if (!dlg) {
      dlg = document.createElement('dialog');
      dlg.id = 'photo-view';
      dlg.className = 'photo-view';
      dlg.innerHTML = `<figure><img alt=""><figcaption></figcaption></figure><button class="icon-btn" type="button" data-close aria-label="Закрыть">${icon('close')}</button>`;
      document.body.appendChild(dlg);
      dlg.addEventListener('click', e => { if (e.target === dlg || e.target.closest('[data-close]')) dlg.close(); });
    }
    const img = $('img', dlg);
    img.removeAttribute('src');
    img.alt = caption || 'Фото куста';
    $('figcaption', dlg).textContent = caption || '';
    img.dataset.photo = id;
    fillPhotos(dlg);
    if (!dlg.open) dlg.showModal();
  }

  // the photos for a copy in a file: as data URLs, so that the copy is one file
  async function photosOut(plants) {
    const out = {};
    for (const id of plants.flatMap(photoIds)) {
      const blob = await photoGet(id).catch(() => null);
      if (!blob) continue;
      out[id] = await new Promise(resolve => { const r = new FileReader(); r.onload = () => resolve(String(r.result)); r.onerror = () => resolve(null); r.readAsDataURL(blob); });
      if (!out[id]) delete out[id];
    }
    return out;
  }
  // and back: only pictures, only of a sane size
  async function photosIn(map) {
    let n = 0;
    for (const [id, url] of Object.entries(map || {})) {
      if (typeof url !== 'string' || !/^data:image\/(jpeg|png|webp);base64,/.test(url) || url.length > 6e6 || !/^[a-z0-9]{4,32}$/.test(id)) continue;
      const blob = await fetch(url).then(r => r.blob()).catch(() => null);
      if (blob) { await photoPut(id, blob).catch(() => {}); n++; }
    }
    return n;
  }
