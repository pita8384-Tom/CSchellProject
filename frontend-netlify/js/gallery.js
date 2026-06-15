// Gallery and Modal functionality

// Generic modal handler function
function setupModalHandlers(tileId, modalId, closeId) {
  const tile = document.getElementById(tileId);
  const modal = document.getElementById(modalId);
  const closeBtn = document.getElementById(closeId);

  if (tile && modal && closeBtn) {
    tile.addEventListener("click", function (e) {
      e.preventDefault();
      modal.classList.remove("hidden");
      modal.classList.add("flex");
    });

    closeBtn.addEventListener("click", function () {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
    });

    // Close modal when clicking outside content area
    modal.addEventListener("click", function (e) {
      if (e.target === modal) {
        modal.classList.add("hidden");
        modal.classList.remove("flex");
      }
    });
  }
}

// Setup all category modals
setupModalHandlers("bodypainting-tile", "bodypainting-modal", "close-bodypainting");
setupModalHandlers("zeichnungen-tile", "zeichnungen-modal", "close-zeichnungen");
setupModalHandlers("events-tile", "events-modal", "close-events");
setupModalHandlers("malerei-tile", "malerei-modal", "close-malerei");
setupModalHandlers("bildhauerei-tile", "bildhauerei-modal", "close-bildhauerei");
setupModalHandlers("sandmalerei-tile", "sandmalerei-modal", "close-sandmalerei");
setupModalHandlers("presse-tile", "presse-modal", "close-presse");

// Lightbox setup - delegates to subgallery.js
const lightboxModal = document.getElementById("lightbox-modal");
const closeLightbox = document.getElementById("close-lightbox");
const lightboxPrev = document.getElementById("lightbox-prev");
const lightboxNext = document.getElementById("lightbox-next");

if (lightboxModal && closeLightbox) {
  // Click handler for images - uses sub-gallery system
  document.addEventListener("click", function (e) {
    if (e.target.classList.contains("body-img")) {
      e.preventDefault();

      // Find category from parent page
      const currentPage = e.target.closest(".page");
      if (currentPage) {
        const pageId = currentPage.id;
        const category = pageId.replace("page-", "");

        // Use sub-gallery system from subgallery.js
        if (typeof openSubGalleryLightbox === "function") {
          openSubGalleryLightbox(category, e.target);
        }
      }
    }
  });

  closeLightbox.addEventListener("click", function () {
    if (typeof closeSubGalleryLightbox === "function") {
      closeSubGalleryLightbox();
    }
  });

  // Navigation buttons
  if (lightboxPrev) {
    lightboxPrev.addEventListener("click", function (e) {
      e.stopPropagation();
      if (typeof navigateSubGallery === "function") {
        navigateSubGallery(-1);
      }
    });
  }

  if (lightboxNext) {
    lightboxNext.addEventListener("click", function (e) {
      e.stopPropagation();
      if (typeof navigateSubGallery === "function") {
        navigateSubGallery(1);
      }
    });
  }

  // Keyboard navigation
  document.addEventListener("keydown", function (e) {
    if (!lightboxModal.classList.contains("hidden")) {
      if (e.key === "ArrowLeft") {
        if (typeof navigateSubGallery === "function") {
          navigateSubGallery(-1);
        }
      } else if (e.key === "ArrowRight") {
        if (typeof navigateSubGallery === "function") {
          navigateSubGallery(1);
        }
      } else if (e.key === "Escape") {
        if (typeof closeSubGalleryLightbox === "function") {
          closeSubGalleryLightbox();
        }
      }
    }
  });

  // Close on background click
  lightboxModal.addEventListener("click", function (e) {
    if (e.target === lightboxModal) {
      if (typeof closeSubGalleryLightbox === "function") {
        closeSubGalleryLightbox();
      }
    }
  });
}
