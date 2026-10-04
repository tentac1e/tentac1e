  /* ================================================================== */
  /* BOOT                                                                */
  /* ================================================================== */
  const boot = () => {
    const science = function initScience() { if (window.BasilScience) window.BasilScience.init({ toast }); };
    // content first, decoration after: the animated background and bush start once the chapter is ready
    let steps = [initTheme, initHome, initVarieties, initQuiz, initPlaces, initSoil, initCalendar, initDli, initElements, initStages, initPlan, initNpk, initDose, initSim, initGerm, initDiagnostics, initGlossary, initChecklist, initRecipes, initGarden, initInstall, science, initSheets, initPeek, initPagers, initSearch, initScrollChrome, initRouter, initReadingPos, initLinks, initPageAction, initHoverLight, initOffscreenPause, initScene];
    // inside the «Заглянуть» sheet: the place and what works in it — no background or bush, no bookmark, no worker,
    // no search or pagers of its own (the page around the sheet has them)
    if (PEEK) steps = steps.filter(fn => ![initHome, initInstall, initPagers, initSearch, initScrollChrome, initReadingPos, initHoverLight, initScene].includes(fn));
    // hand control back to the browser every ~40 ms so taps and scrolling never wait for start-up
    const pause = () => (window.scheduler && typeof window.scheduler.yield === 'function' ? window.scheduler.yield() : new Promise(r => setTimeout(r, 0)));
    (async () => {
      let t0 = performance.now();
      for (const fn of steps) {
        try { fn(); } catch (err) { console.error(`[basil] ${fn.name} failed`, err); }
        if (performance.now() - t0 > 40) { await pause(); t0 = performance.now(); }
      }
      document.documentElement.classList.add('is-ready');
      document.dispatchEvent(new CustomEvent('basil:ready'));
    })();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
