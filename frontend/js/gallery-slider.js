(function () {
  'use strict';

  // ── Lightbox state ──────────────────────────────────────────────
  let lightboxEl = null;
  let lbImages   = [];
  let lbIndex    = 0;
  let lbZoom     = 1;
  let lbPanX     = 0;
  let lbPanY     = 0;
  let lbDragging = false;
  let lbDragStartX = 0;
  let lbDragStartY = 0;

  // ── Init: attach click handlers to all gallery images ───────────
  function initGallerySliders() {
    // Find all detail page gallery grids
    const pages = document.querySelectorAll('.intro-detail-page');
    pages.forEach(page => {
      const imgs = Array.from(page.querySelectorAll('img.body-img, img.gallery-img-height'));
      imgs.forEach(img => {
        img.style.cursor = 'zoom-in';
        // Use capture:true so this fires before gallery.js document-level delegation
        img.addEventListener('click', (e) => {
          e.stopPropagation();
          e.stopImmediatePropagation();
          openLightbox(imgs, imgs.indexOf(img));
        }, true);
      });
    });
  }

  // ── Lightbox ────────────────────────────────────────────────────
  function openLightbox(imgs, idx) {
    if (!lightboxEl) buildLightbox();
    lbImages = imgs;
    lbIndex  = idx;
    lbZoom   = 1;
    lbPanX   = 0;
    lbPanY   = 0;
    renderLightbox();
    lightboxEl.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
  }

  function closeLightbox() {
    if (!lightboxEl) return;
    lightboxEl.style.display = 'none';
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onKeyDown);
  }

  function renderLightbox() {
    const img = lightboxEl.querySelector('.lb-img');
    img.src = lbImages[lbIndex].src;
    img.alt = lbImages[lbIndex].alt;
    lbPanX = 0;
    lbPanY = 0;
    applyTransform(img);
    // Counter
    lightboxEl.querySelector('.lb-counter').textContent =
      `${lbIndex + 1} / ${lbImages.length}`;
  }

  function applyTransform(img) {
    if (!img) img = lightboxEl.querySelector('.lb-img');
    img.style.transform = `translate(${lbPanX}px, ${lbPanY}px) scale(${lbZoom})`;
    img.style.cursor = lbZoom > 1 ? (lbDragging ? 'grabbing' : 'grab') : 'default';
  }

  function zoom(delta) {
    lbZoom = Math.min(Math.max(lbZoom + delta, 0.4), 5);
    if (lbZoom <= 1) { lbPanX = 0; lbPanY = 0; }
    applyTransform();
  }

  function onKeyDown(e) {
    if (e.key === 'ArrowLeft')  { lbIndex = (lbIndex - 1 + lbImages.length) % lbImages.length; renderLightbox(); }
    if (e.key === 'ArrowRight') { lbIndex = (lbIndex + 1) % lbImages.length; renderLightbox(); }
    if (e.key === '+' || e.key === '=') zoom(0.25);
    if (e.key === '-')           zoom(-0.25);
    if (e.key === 'Escape')      closeLightbox();
  }

  function buildLightbox() {
    lightboxEl = document.createElement('div');
    lightboxEl.className = 'gallery-lightbox';
    lightboxEl.innerHTML = `
      <div class="lb-backdrop"></div>
      <div class="lb-top-bar">
        <span class="lb-counter">1 / 1</span>
      </div>
      <button class="lb-close" title="Schließen">×</button>
      <button class="lb-arrow lb-prev" title="Zurück">&#8249;</button>
      <div class="lb-stage">
        <img class="lb-img" src="" alt="" />
      </div>
      <button class="lb-arrow lb-next" title="Weiter">&#8250;</button>
      <div class="lb-controls">
        <button class="lb-ctrl-btn lb-zoom-out" title="Verkleinern">－</button>
        <button class="lb-ctrl-btn lb-zoom-reset" title="Zurücksetzen">&#8981</button>
        <button class="lb-ctrl-btn lb-zoom-in"  title="Vergrößern">＋</button>
      </div>
    `;
    document.body.appendChild(lightboxEl);

    lightboxEl.querySelector('.lb-close').addEventListener('click', closeLightbox);

    lightboxEl.querySelector('.lb-prev').addEventListener('click', () => {
      lbIndex = (lbIndex - 1 + lbImages.length) % lbImages.length;
      renderLightbox();
    });
    lightboxEl.querySelector('.lb-next').addEventListener('click', () => {
      lbIndex = (lbIndex + 1) % lbImages.length;
      renderLightbox();
    });

    lightboxEl.querySelector('.lb-zoom-out').addEventListener('click',   () => zoom(-0.25));
    lightboxEl.querySelector('.lb-zoom-reset').addEventListener('click', () => {
      lbZoom = 1; lbPanX = 0; lbPanY = 0; applyTransform();
    });
    lightboxEl.querySelector('.lb-zoom-in').addEventListener('click',    () => zoom(0.25));

    // Mouse-wheel zoom inside lightbox
    lightboxEl.querySelector('.lb-stage').addEventListener('wheel', (e) => {
      e.preventDefault();
      zoom(e.deltaY < 0 ? 0.15 : -0.15);
    }, { passive: false });

    // Drag-to-pan (mouse)
    const stage = lightboxEl.querySelector('.lb-stage');
    stage.addEventListener('mousedown', (e) => {
      if (lbZoom <= 1) return;
      lbDragging = true;
      lbDragStartX = e.clientX - lbPanX;
      lbDragStartY = e.clientY - lbPanY;
      applyTransform();
      e.preventDefault();
    });
    window.addEventListener('mousemove', (e) => {
      if (!lbDragging) return;
      lbPanX = e.clientX - lbDragStartX;
      lbPanY = e.clientY - lbDragStartY;
      const img = lightboxEl.querySelector('.lb-img');
      img.style.transition = 'none';
      applyTransform(img);
    });
    window.addEventListener('mouseup', () => {
      if (!lbDragging) return;
      lbDragging = false;
      const img = lightboxEl.querySelector('.lb-img');
      img.style.transition = '';
      applyTransform(img);
    });

    // Drag-to-pan (touch)
    stage.addEventListener('touchstart', (e) => {
      if (lbZoom <= 1 || e.touches.length !== 1) return;
      lbDragging = true;
      lbDragStartX = e.touches[0].clientX - lbPanX;
      lbDragStartY = e.touches[0].clientY - lbPanY;
    }, { passive: true });
    stage.addEventListener('touchmove', (e) => {
      if (!lbDragging || e.touches.length !== 1) return;
      lbPanX = e.touches[0].clientX - lbDragStartX;
      lbPanY = e.touches[0].clientY - lbDragStartY;
      const img = lightboxEl.querySelector('.lb-img');
      img.style.transition = 'none';
      applyTransform(img);
      e.preventDefault();
    }, { passive: false });
    stage.addEventListener('touchend', () => {
      lbDragging = false;
      const img = lightboxEl.querySelector('.lb-img');
      img.style.transition = '';
      applyTransform(img);
    });
  }

  // Expose for manual re-init (called from component-loader after components load)
  window.initGallerySliders = initGallerySliders;

  // Public API: Thema-Lightbox öffnen mit einem Array von {src, alt} Foto-Objekten
  window.openThemaSlider = function (photos, startIndex) {
    if (!photos || !photos.length) return;
    if (!lightboxEl) buildLightbox();
    lbImages = photos;
    lbIndex  = startIndex || 0;
    lbZoom   = 1;
    lbPanX   = 0;
    lbPanY   = 0;
    renderLightbox();
    lightboxEl.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
  };

  // Auto-run if DOM already ready
  if (document.readyState !== 'loading') {
    initGallerySliders();
  } else {
    document.addEventListener('DOMContentLoaded', initGallerySliders);
  }
})();
