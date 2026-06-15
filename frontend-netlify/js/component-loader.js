(async function () {
  // 0. CSS links are now in index.html <head> for instant load (no FOUC)

  // 1. Fetch and inject all components into their placeholders
  const placeholders = document.querySelectorAll('[data-component]');
  for (const el of placeholders) {
    const name = el.getAttribute('data-component');
    try {
      const res = await fetch(`components/${name}.html`);
      const html = await res.text();
      const temp = document.createElement('div');
      temp.innerHTML = html;
      el.replaceWith(...temp.childNodes);
    } catch (e) {
      console.error(`Component load failed: ${name}`, e);
    }
  }

  // 2. Helper: load a script and wait for it
  function loadScript(src) {
    return new Promise((resolve) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = () => { console.warn('Could not load:', src); resolve(); };
      document.body.appendChild(s);
    });
  }

  // 3. Load all scripts in correct order
  await loadScript('admin-config.js');
  await loadScript('js/runtime-config.js');
  await loadScript('js/config.js');

  function rewriteStaticMediaUrls() {
    if (typeof window.resolveMediaUrl !== 'function') return;

    document.querySelectorAll('img[src]').forEach((img) => {
      const src = img.getAttribute('src') || '';
      if (src.startsWith('img/') || src.startsWith('/img/')) {
        img.setAttribute('src', window.resolveMediaUrl(src));
      }
    });

    document.querySelectorAll('[style*="img/"]').forEach((el) => {
      const style = el.getAttribute('style') || '';
      const rewritten = style
        .replace(/url\((['"]?)\/img\//g, (_m, q) => `url(${q}${window.resolveMediaUrl('/img/').replace(/\/$/, '')}/`)
        .replace(/url\((['"]?)img\//g, (_m, q) => `url(${q}${window.resolveMediaUrl('img/').replace(/\/$/, '')}/`);
      if (rewritten !== style) {
        el.setAttribute('style', rewritten);
      }
    });
  }

  rewriteStaticMediaUrls();

  await loadScript('js/scroll.js?v=3');
  await loadScript('js/navigation.js?v=3');
  await loadScript('js/intro.js?v=3');
  await loadScript('js/subgallery.js?v=3');
  await loadScript('js/gallery-slider.js?v=3');  // must be before gallery.js to intercept clicks
  await loadScript('js/gallery.js?v=3');
  await loadScript('js/gallery-loader.js?v=3');
  await loadScript('js/language.js?v=3');
  await loadScript('js/contact-form.js?v=3');
  await loadScript('js/init.js?v=3');
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/textFit/2.4.0/textFit.min.js');

  // 4. Apply saved language (must run after components + language.js are loaded)
  if (typeof initLanguage === 'function') initLanguage();

  // Make body visible (Tailwind is now compiled, no CDN polling needed)
  document.body.style.visibility = 'visible';

  // 5. Re-fire DOMContentLoaded so init.js and other scripts trigger their listeners
  document.dispatchEvent(new Event('DOMContentLoaded'));

  // 5. Slide menu toggle
  window.toggleSlideMenu = function () {
    document.getElementById('slide-menu').classList.toggle('active');
    document.getElementById('slide-menu-overlay').classList.toggle('active');
    document.querySelector('.hamburger-mobile').classList.toggle('menu-active');
  };

  // 6. Hide deleted placeholder images
  document.querySelectorAll('img[data-image-id]').forEach((img) => {
    const imageId = img.getAttribute('data-image-id');
    if (!imageId) return;
    const key = `deleted_placeholders_${imageId.split('-')[0]}`;
    const deleted = JSON.parse(localStorage.getItem(key) || '[]');
    if (deleted.includes(imageId)) img.parentElement.style.display = 'none';
  });

  // 7. TextFit for Übersicht tile titles
  function applyTextFitToUebersicht() {
    if (typeof textFit !== 'function') return;
    const texts = document.querySelectorAll('#page-1 .uebersicht-tile span');
    const vw = window.innerWidth;
    texts.forEach(el => {
      textFit(el, {
        alignHoriz: true, alignVert: false, multiLine: false,
        reProcess: true, widthOnly: true, detectMultiLine: false,
        maxLineHeight: 1.1, allowLineBreak: false,
        minFontSize: vw <= 480 ? 8 : vw <= 600 ? 10 : vw <= 768 ? 12 : 14,
        maxFontSize: vw <= 480 ? 16 : vw <= 600 ? 20 : vw <= 768 ? 28 : 48
      });
    });
  }

  applyTextFitToUebersicht();

  let resizeTimeout;
  ['resize', 'orientationchange', 'load'].forEach(ev =>
    window.addEventListener(ev, () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(applyTextFitToUebersicht, 250);
    })
  );
  document.querySelectorAll('#page-1 .uebersicht-tile img').forEach(img => {
    if (img.complete) applyTextFitToUebersicht();
    else img.addEventListener('load', applyTextFitToUebersicht);
  });
})();
